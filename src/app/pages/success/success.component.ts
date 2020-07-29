import {Component, Input, OnInit} from '@angular/core';
import {SuccessLog} from '../../core/services/supreme/success-log';

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css']
})
export class SuccessComponent implements OnInit {

  @Input()
  successLog: SuccessLog[];

  constructor() { }

  ngOnInit(): void {
    this.successLog = JSON.parse(localStorage.getItem('successLog')) || [];
  }

}
