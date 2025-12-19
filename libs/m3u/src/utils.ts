export function isURL(url: string){
  return url.toLowerCase().startsWith("http")
}

export function isValidEXTHeader(header: string){
  return header.startsWith("#EXTINF:")
}
