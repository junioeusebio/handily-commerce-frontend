/** One changelog entry from `GET {apiRoot}/changelog` (BE-owned Major/Mirror releases). */
export interface ChangelogItem {
  title: string;
  summary: string;
}
