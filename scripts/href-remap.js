import { JSDOM } from 'jsdom';
import isAbsoluteUrl from 'is-absolute-url';


export function remap404Hrefs (html, baseUrl) {
  const jsdom = new JSDOM(html);
  const win = jsdom.window;

  for (let attrName of ['src', 'href']) {
    for (let tag of win.document.querySelectorAll(`*[${attrName}]`)) {
      const currValue = tag.attributes[attrName].value;
      if (currValue && !isAbsoluteUrl(currValue) && !currValue.startsWith('//')) {
        tag.attributes[attrName].value = `${baseUrl}${currValue}`;
      }
    }
  }

  return jsdom.serialize();
}