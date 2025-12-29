import { Component } from '@angular/core';
import { Constants } from '../../app.constants';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { CommonService } from '../../services/common.service';

import * as Papa from 'papaparse';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Collaboration {
  Id: string;
  Title: string;
  Description: string;
  Image: string;
  MoreImages?: string;
  CollaboratorInstagramId: string;
  InstaUrl: string;
}

@Component({
  selector: 'app-collabdetail',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './collabdetail.component.html',
  styleUrl: './collabdetail.component.scss'
})


export class CollabdetailComponent {
private collaborationsSheetUrl = Constants.SheetUrls.Collaborations;

collab: Collaboration | null = null;
selectedImage: string | null = null;
MoreImgs: string[] = [];

instaDisplay: string = "";
constructor(private http: HttpClient, private route: ActivatedRoute, private loader: LoaderService, private commonService: CommonService) {}
  
  ngOnInit(): void {
    this.loader.show();
    const collabId = this.route.snapshot.paramMap.get('id');

    /* ================= PRINT DATA ================= */
        this.http.get(this.collaborationsSheetUrl, { responseType: 'text' }).subscribe(csvData => {
          Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (result: Papa.ParseResult<Collaboration>) => {
              const collaborations = (result.data as Collaboration[]).map(row => this.commonService.trimObject(row));
              this.collab = collaborations.find(c => c.Id === collabId) || null;

              if (this.collab) {
                // ✅ Main image → thumbnail
                this.collab.Image = this.commonService.convertDriveToThumbnail(this.collab.Image);
                this.selectedImage = this.collab.Image;
    
                // ✅ MoreImgs = [main image + extra images]
                this.MoreImgs = [
                  this.collab.Image,
                  ...(this.collab.MoreImages
                    ? this.collab.MoreImages
                        .split(';')
                        .map(img => img.trim())
                        .filter(Boolean)
                        .map(img => this.commonService.convertDriveToThumbnail(img))
                    : [])
                ];

                //Insta URL
                this.collab.InstaUrl = this.commonService.instaUrl(this.collab.CollaboratorInstagramId)
                this.instaDisplay = "@" + this.collab.CollaboratorInstagramId;
              }
              this.loader.hide();
    
              // markLoaded();
            }
          });
        });
  }

  changeImage(img: string): void {
    this.selectedImage = img;
  }
}
