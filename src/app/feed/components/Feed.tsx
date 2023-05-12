import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { Button } from "@camome/core/Button";
import {
  useInfiniteQuery,
  type QueryKey,
  type QueryFunction,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { TbArrowUp } from "react-icons/tb";
import InfiniteScroll from "react-infinite-scroller";

import type { AppBskyFeedDefs } from "@atproto/api";

import { FeedSkelton } from "@/src/app/feed/components/FeedSkelton";
import { reloadFeedForNewPosts } from "@/src/app/feed/lib/reloadFeedForNewPosts";
import Post from "@/src/app/post/components/Post";
import PostComposer from "@/src/app/post/components/composer/PostComposer";
import { feedItemToUniqueKey } from "@/src/app/post/lib/feedItemToUniqueKey";
import {
  FeedInfiniteData,
  mutateFeedItem,
} from "@/src/app/post/lib/mutateFeedItem";
import { MutatePostCache } from "@/src/app/post/lib/types";
import { queryKeys } from "@/src/app/root/lib/queryKeys";
import SpinnerFill from "@/src/components/SpinnerFill";
import { isButtonLoading } from "@/src/components/isButtonLoading";

import styles from "./Feed.module.scss";

export type FeedQueryFn<K extends QueryKey> = QueryFunction<
  {
    cursor?: string;
    feed: FeedViewPost[];
  },
  K
>;

type Props<K extends QueryKey> = {
  queryKey: K;
  queryFn: FeedQueryFn<K>;
  fetchNewLatest?: () => Promise<AppBskyFeedDefs.FeedViewPost | undefined>;
  maxPages?: number;
  filter?: (
    posts: AppBskyFeedDefs.FeedViewPost[]
  ) => AppBskyFeedDefs.FeedViewPost[];
  cacheTime?: number;
};

export function Feed<K extends QueryKey>({
  queryKey,
  queryFn,
  fetchNewLatest,
  maxPages,
  filter = (posts) => posts,
  cacheTime,
}: Props<K>) {
  const { t } = useTranslation();
  const {
    status,
    data,
    error,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage, allPages) => {
      if (maxPages && allPages.length >= maxPages) return undefined;
      return lastPage.cursor ? { cursor: lastPage.cursor } : undefined;
    },
    refetchOnMount: false,
    cacheTime,
  });
  const queryClient = useQueryClient();

  const allItems = filter(data?.pages.flatMap((p) => p.feed) ?? []);
  const currentLatestUri = allItems.at(0)?.post.uri;

  const { data: isNewAvailable } = useQuery(
    queryKeys.feed.new.$(queryKey, currentLatestUri, fetchNewLatest),
    async () => {
      const newLatest = await fetchNewLatest?.();
      if (!newLatest) return false;
      // FIXME: consider about reposts which share the same URI
      return newLatest.post.uri !== currentLatestUri;
    },
    {
      refetchInterval: 15 * 1000, // 15 seconds; the same as the official web app
      refetchOnWindowFocus: import.meta.env.PROD,
      enabled: !!fetchNewLatest,
    }
  );

  const loadNewPosts = () => {
    reloadFeedForNewPosts(queryClient, queryKey);
  };

  const revalidateOnPost = () => {
    queryClient.invalidateQueries(queryKey);
  };

  const mutatePostCache: MutatePostCache = ({ uri, fn }) => {
    queryClient.setQueryData<FeedInfiniteData>(queryKey, (data) =>
      mutateFeedItem(data, uri, fn)
    );
  };

  if (status === "loading") {
    return <FeedSkelton count={18} />;
  } else if (status === "error") {
    return <span>Error: {(error as Error).message}</span>;
  }

  return (
    <div className={styles.container}>
      <InfiniteScroll
        pageStart={0}
        loadMore={() => !isFetchingNextPage && fetchNextPage()}
        hasMore={hasNextPage}
        loader={<SpinnerFill key="__loader" />}
      >
        <>
          {allItems.map((item) => (
            <Post
              data={item}
              key={feedItemToUniqueKey(item)}
              revalidate={refetch}
              mutatePostCache={mutatePostCache}
              className={styles.post}
            />
          ))}
          {!hasNextPage && (
            <div className={styles.noMore} key="__noMore">
              nothing more to say...
            </div>
          )}
        </>
      </InfiniteScroll>
      {isNewAvailable && (
        <Button
          size="sm"
          onClick={loadNewPosts}
          className={styles.newItemBtn}
          startDecorator={<TbArrowUp />}
          {...isButtonLoading(isFetching && !isFetchingNextPage)}
        >
          {t("feed.load-new-posts")}
        </Button>
      )}
      <PostComposer revalidate={revalidateOnPost} />
    </div>
  );
}
