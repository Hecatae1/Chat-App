import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
})
export class LinkifyPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) { }

  transform(text: string): SafeHtml {
    if (!text) return '';
    const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
    const linked = text.replace(urlRegex, url => {
      const href = url.startsWith('http') ? url : `https://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(linked);
  }

}
// LinkifyPipe is a custom Angular pipe that scans a text string for URLs
// and converts them into clickable HTML <a> links. It ensures that pasted links
//  in chat messages are interactive and open in a new browser tab.
// It uses Angular's DomSanitizer to safely render the generated HTML.