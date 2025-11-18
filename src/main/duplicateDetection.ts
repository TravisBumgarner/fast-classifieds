const generateUniqueId = ({ siteUrl, jobUrl, jobTitle }: { siteUrl: string; jobUrl: string; jobTitle: string }) => {
  return { siteUrl, jobUrl, jobTitle }
}

export default generateUniqueId
