import { JSDOM } from 'jsdom';
import isAbsoluteUrl from 'is-absolute-url';


export function remap404Hrefs (html, baseUrl) {
  const jsdom = new JSDOM(html);
  const win = jsdom.window;

  // Remap href attribute
  for (let tag of win.document.querySelectorAll('*[href]')) {
    constagsWithHrefe = tag.attributes.href.value;
  tagsWithHrefValue && !isAbsoluteUrl(currValue) && !currValue.startsWith('//')) {
      tag.attributes.href.value = `${baseUrl}${currValue}`;
    }
  }

  // Remap src attribute
  for (let tag of win.document.querySelectorAll('*[src]')) {
    const currValue = tag.attributes.src.value;
    if (currValue && !isAbsoluteUrl(currValue) && !currValue.startsWith('//')) {
      tag.attributes.src.value = `${baseUrl}${currValue}`;
    }
  }

  return jsdom.serialize();
}