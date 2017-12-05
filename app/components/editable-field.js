/* eslint ember/order-in-components: 0 */
import Component from '@ember/component';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { timeout, task } from 'ember-concurrency';

export default Component.extend({
  value: null,
  isEditing: false,
  isSaving: false,
  isSaveDisabled: false,
  renderHtml: false,
  classNames: ['editinplace'],
  clickPrompt: null,
  looksEmpty: computed('value', function(){
    let value = this.get('value') || '';
    let text = value.toString();
    let noTagsText = text.replace(/(<([^>]+)>)/ig,"");
    let strippedText = noTagsText.replace(/&nbsp;/ig,"").replace(/\s/g, "");

    return isEmpty(strippedText);
  }),

  saveData: task(function * () {
    yield timeout(1);
    yield this.get('save')();
    this.set('isEditing', false);
  }).drop(),

  closeEditor: task(function * () {
    yield timeout(1);
    yield this.get('close')();
    this.set('isEditing', false);
  }).drop(),

  edit: task(function * () {
    this.set('isEditing', true);
    yield timeout(10);
    const control = this.$('.editor').find('input,textarea,select,.fr-element').filter(':visible:first');

    control.focus();
  }).drop(),
});
