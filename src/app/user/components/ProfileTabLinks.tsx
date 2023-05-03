import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import styles from "./ProfileTabLinks.module.scss";

type Props = {
  className?: string;
};

export function ProfileTabLinks({ className }: Props) {
  const { t } = useTranslation("users");
  return (
    <ul className={clsx(styles.list, className)}>
      <Item to="." label={t("tabs.posts")} />
      <Item to="./with-replies" label={t("tabs.replies")} />
      <Item to="./likes" label={t("tabs.likes")} />
    </ul>
  );
}

type ItemProps = {
  to: string;
  label: string;
};

function Item({ to, label }: ItemProps) {
  return (
    <li className={styles.item}>
      <NavLink to={to} replace preventScrollReset end>
        {label}
      </NavLink>
    </li>
  );
}
