export const renderPrompt = ({
  prompt,
  siteContent,
  siteUrl,
  jobToJSONPrompt,
}: {
  prompt: string
  siteContent: string
  siteUrl: string
  jobToJSONPrompt: string
}) => {
  const fullPrompt = `
USER CRITERIA:
${prompt}

SCRAPED CONTENT:
${siteContent}

SITE_URL: ${siteUrl}

${jobToJSONPrompt}
        `
  return fullPrompt
}
