import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'watch',
  templateUrl: './watch.page.html',
  styleUrls: ['./watch.page.scss'],
})
export class WatchPage implements OnInit {
  channel = ''
  playerIframeUrl


  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}
  
  ngOnInit() {
    this.channel = this.route.snapshot.paramMap.get('channel');
    this.playerIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.playerUrl + '&channel='+this.channel)
  }
  
}
