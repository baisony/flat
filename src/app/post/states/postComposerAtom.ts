import { AppBskyFeedDefs } from "@atproto/api";
import { atom } from "jotai";

type PostComposerAtom = {
  open: boolean;
  replyTarget?: AppBskyFeedDefs.FeedViewPost;
  quoteTarget?: AppBskyFeedDefs.PostView;
  linkCardUri?: string;
};

export const postComposerAtom = atom<PostComposerAtom>({
  open: false,
  replyTarget: undefined,
  quoteTarget: undefined,
  linkCardUri: undefined,
});
