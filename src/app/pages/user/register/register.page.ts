import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonRouterOutlet } from '@ionic/angular';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_PATTERN } from 'src/app/common/constant';
import { ResultCode } from 'src/app/common/enum';
import { captchaFeedback, emailFeedback, passwordFeedback, usernameFeedback } from 'src/app/common/feedback';
import { ValidationFeedback } from 'src/app/common/interface';
import { Register } from 'src/app/models/form.model';
import { Result, User } from 'src/app/models/onchat.model';
import { ApiService } from 'src/app/services/api.service';
import { GlobalData } from 'src/app/services/global-data.service';
import { OnChatService } from 'src/app/services/onchat.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { SocketService } from 'src/app/services/socket.service';
import { StrUtil } from 'src/app/utils/str.util';
import { AsyncValidator } from 'src/app/validators/async.validator';
import { SyncValidator } from 'src/app/validators/sync.validator';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  /** 密码框类型 */
  pwdInputType: string = 'password';
  usernameMaxLength: number = USERNAME_MAX_LENGTH;
  passwordMaxLength: number = PASSWORD_MAX_LENGTH;
  emailMaxLength: number = EMAIL_MAX_LENGTH;
  /** 60秒倒计时 */
  countdown: number = 60;
  /** 倒计时计时器 */
  countdownTimer: number;

  form: FormGroup = this.formBuilder.group({
    username: [
      '', [
        Validators.pattern(USERNAME_PATTERN),
        Validators.required,
        Validators.minLength(USERNAME_MIN_LENGTH),
        Validators.maxLength(USERNAME_MAX_LENGTH)
      ]
    ],
    email: [
      '', [
        Validators.required,
        Validators.maxLength(EMAIL_MAX_LENGTH),
        Validators.email
      ], [
        this.asyncValidator.legalEmail()
      ]
    ],
    password: [
      '', [
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(PASSWORD_MAX_LENGTH)
      ]
    ],
    confirmPassword: [
      '', [
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(PASSWORD_MAX_LENGTH)
      ]
    ],
    captcha: [
      '', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6)
      ]
    ],
  }, {
    validators: SyncValidator.equal('password', 'confirmPassword')
  });

  usernameFeedback: ValidationFeedback = usernameFeedback;
  passwordFeedback: ValidationFeedback = passwordFeedback;
  emailFeedback: ValidationFeedback = emailFeedback;
  captchaFeedback: ValidationFeedback = captchaFeedback;

  constructor(
    public globalData: GlobalData,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private asyncValidator: AsyncValidator,
    private onChatService: OnChatService,
    private apiService: ApiService,
    private overlayService: OverlayService,
    private socketService: SocketService,
    private routerOutlet: IonRouterOutlet
  ) { }

  ngOnInit() {
    this.routerOutlet.swipeGesture = false;

    const username = this.route.snapshot.queryParams.username;
    username && this.form.controls.username.setValue(username);
  }

  ngOnDestroy() {
    this.routerOutlet.swipeGesture = true;
  }

  register() {
    if (!this.form.valid || this.globalData.navigating) { return; }

    this.globalData.navigating = true;

    const { username, password, email, captcha } = this.form.value;
    this.apiService.register(new Register(username, password, email, captcha)).subscribe((result: Result<User>) => {
      const { code, data, msg } = result;
      this.overlayService.presentToast(msg || '注册成功！即将跳转…', code === ResultCode.Success ? 1000 : 2000);

      if (code !== ResultCode.Success) {
        this.globalData.navigating = false;
        return;
      }

      this.globalData.user = data;
      this.socketService.init();

      setTimeout(() => {
        this.router.navigateByUrl('/');
        this.onChatService.init();
      }, 1000);
    });
  }

  sendCaptcha() {
    const ctrl = this.form.get('email');
    if (ctrl.errors || this.countdownTimer) { return; }

    this.apiService.sendEmailCaptcha(ctrl.value).subscribe((result: Result<boolean>) => {
      this.overlayService.presentToast(result.code === ResultCode.Success ? '验证码发送至邮箱！' : '验证码发送失败！');
    });

    this.countdownTimer = window.setInterval(() => {
      if (--this.countdown <= 0) {
        window.clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.countdown = 60;
      }
    }, 1000);
  }

  /**
   * 切换密码输入框的TYPE值
   */
  togglePwdInputType() {
    this.pwdInputType = this.pwdInputType === 'text' ? 'password' : 'text';
  }

  /**
   * 消除表单控件的值的空格
   * @param controlName 控件名
   */
  trimAll(controlName: string) {
    const value = StrUtil.trimAll(this.form.get(controlName).value);
    this.form.controls[controlName].setValue(value);
  }

}
