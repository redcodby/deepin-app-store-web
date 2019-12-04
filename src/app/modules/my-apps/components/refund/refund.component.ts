import { Component, OnInit, ViewChild, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { FormBuilder, Validators, FormArray } from '@angular/forms';
import { RefundReason } from '../../services/refund-reason.model';
import { RemoteApp } from '../../services/remote-app.service';
import { RefundService } from 'app/services/refund.service';
@Component({
  selector: 'm-refund',
  templateUrl: './refund.component.html',
  styleUrls: ['./refund.component.scss'],
})
export class RefundComponent implements OnInit {
  constructor(private fb: FormBuilder, private refundService: RefundService) {}
  readonly RefundReason = RefundReason;
  @ViewChild('dialogRef', { static: true }) dialog: ElementRef<HTMLDialogElement>;
  @Input() remoteApp: RemoteApp;
  @Output() confirm = new EventEmitter();
  @Output() cancel = new EventEmitter();
  form = this.fb.group({
    reason: this.fb.array([...Object.values(RefundReason).map(() => [false])], requiredTrueArray()),
    content: [''],
  });
  successTip = false;
  ngOnInit() {
    this.dialog.nativeElement.showModal();
    this.dialog.nativeElement.addEventListener('close', () => this.cancel.next(), (this.successTip = false));
    console.log(this.form);
  }
  close() {
    this.dialog.nativeElement.close();
    this.successTip = false;
  }
  async submit() {
    const formValue = {
      reason: this.form.value.reason
        .map((bool: boolean, index: number) => (bool ? { id: index } : null))
        .filter(Boolean),
      content: this.form.value.content,
    };
    await this.refundService.create(this.remoteApp.order_number, formValue);
    this.confirm.emit(null);
    this.successTip = true;
  }
}

function requiredTrueArray() {
  return (control: FormArray) => {
    if (control.controls.some(c => Validators.requiredTrue(c) == null)) {
      return null;
    }
    return { required: true };
  };
}
