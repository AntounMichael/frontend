import Component from '@ember/component';

export default Component.extend({
  classNames: ['toggle-onoff'],

  lable: null,
  on: false,

  click() {
    this.sendAction();
  }
});
