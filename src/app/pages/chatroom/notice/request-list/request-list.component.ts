import { Component, OnInit } from '@angular/core';
import { ChatRequestStatus } from 'src/app/common/enum';
import { GlobalData } from 'src/app/services/global-data.service';

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss'],
})
export class RequestListComponent implements OnInit {
  chatRequestStatus: typeof ChatRequestStatus = ChatRequestStatus;

  constructor(
    public globalData: GlobalData,
  ) { }

  ngOnInit() { }

}