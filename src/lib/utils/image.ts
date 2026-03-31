export function isRemoteImageSrc(src?: string | null) {
  return Boolean(src && /^https?:\/\//i.test(src));
}

