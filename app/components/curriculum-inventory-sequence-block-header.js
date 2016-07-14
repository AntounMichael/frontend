import Ember from 'ember';
import { validator, buildValidations } from 'ember-cp-validations';
import ValidationErrorDisplay from 'ilios/mixins/validation-error-display';

const { inject, Component, computed, RSVP } = Ember;
const { alias } = computed;
const { Promise } = RSVP;
const { service } = inject;

const Validations = buildValidations({
  blockTitle: [
    validator('presence', true),
    validator('length', {
      min: 3,
      max: 200
    }),
  ],
});

export default Component.extend(Validations, ValidationErrorDisplay, {
  didReceiveAttrs(){
    this._super(...arguments);
    this.set('blockTitle', this.get('sequenceBlock.title'));
  },
  store: service(),
  classNames: ['curriculum-inventory-sequence-block-header'],
  report: null,
  reportName: null,
  publishTarget: alias('sequenceBlock'),
  isFinalized: alias('sequenceBlock.report.isFinalized'),
  actions: {
    changeTitle(){
      const block = this.get('sequenceBlock');
      const newTitle = this.get('blockTitle');
      this.send('addErrorDisplayFor', 'blockTitle');
      return new Promise((resolve, reject) => {
        this.validate().then(({validations}) => {
          if (validations.get('isValid')) {
            this.send('removeErrorDisplayFor', 'blockTitle');
            block.set('title', newTitle);
            block.save().then((newBlock) => {
              this.set('blockTitle', newBlock.get('title'));
              this.set('sequenceBlock', newBlock);
              resolve();
            });
          } else {
            reject();
          }
        });
      });
    },

    revertTitleChanges(){
      const block = this.get('sequenceBlock');
      this.set('blockTitle', block.get('title'));
    },
  }
});
