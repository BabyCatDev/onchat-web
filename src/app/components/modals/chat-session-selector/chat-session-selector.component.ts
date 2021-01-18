import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ChatSessionCheckbox } from 'src/app/common/interface';
import { GlobalData } from 'src/app/services/global-data.service';
import { OverlayService } from 'src/app/services/overlay.service';

const ITEM_ROWS: number = 15;

@Component({
  selector: 'app-chat-session-selector',
  templateUrl: './chat-session-selector.component.html',
  styleUrls: ['./chat-session-selector.component.scss'],
})
export class ChatSessionSelectorComponent implements OnInit {
  /** 标题 */
  @Input() title: string;
  /** 会话列表 */
  @Input() chatSessions: ChatSessionCheckbox[];
  /** 选择数量限制 */
  @Input() limit: number;
  /** 提交处理器 */
  @Input() handler: (data: ChatSessionCheckbox[]) => Observable<unknown>;
  /** 搜索关键字 */
  keyword: string = '';
  /** 分页页码 */
  chatSessionsPage: number = 1;
  /** 加载中 */
  loading: boolean = false;

  private subject: Subject<unknown> = new Subject();

  constructor(
    public globalData: GlobalData,
    private overlayService: OverlayService,
    private router: Router
  ) { }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.subject)
    ).subscribe(() => this.dismiss());
  }

  ngOnDestroy() {
    this.subject.next();
    this.subject.complete();
  }

  /**
   * 关闭自己
   */
  dismiss() {
    this.overlayService.dismissModal();
  }

  /**
   * 搜索框变化时
   */
  search() {
    this.chatSessionsPage = 1;
  }

  /**
   * 提交
   */
  async submit() {
    const loading = await this.overlayService.presentLoading();
    this.handler(this.getCheckedChatSessions()).subscribe(() => {
      this.overlayService.dismissModal();
      loading.dismiss();
    });
  }

  /**
   * 是否可以提交
   */
  canSubmit() {
    return !!this.getCheckedChatSessions().length;
  }

  /**
   * 检测checkbox变更
   */
  onChange(item: ChatSessionCheckbox) {
    if (this.getCheckedChatSessions().length > this.limit) {
      item.checked = false;
    }
  }

  /**
   * 获得已选会话列表
   */
  getCheckedChatSessions() {
    return this.chatSessions.filter(o => o.checked);
  }

  /**
   * 是否禁用checkbox
   */
  disabled() {
    return this.getCheckedChatSessions().length >= this.limit;
  }

  /**
   * 分页后的会话列表
   */
  list() {
    let { chatSessions, keyword } = this;
    if (keyword.length) {
      // 模糊搜索：别名和用户ID
      chatSessions = chatSessions.filter(o => o.title.includes(keyword) || (o.data.userId + '').includes(keyword));
    }
    return this.chatSessionsPage ? chatSessions.slice(0, this.chatSessionsPage * ITEM_ROWS) : chatSessions;
  }

  /**
   * 加载更多
   * @param event
   */
  loadData(event: any) {
    if (!this.chatSessionsPage) {
      return event.target.complete();
    }

    if (++this.chatSessionsPage * ITEM_ROWS >= this.globalData.privateChatrooms.length) {
      this.chatSessionsPage = null;
    }

    event.target.complete();
  }

}
