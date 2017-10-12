import Ember from 'ember';
import { validator, buildValidations } from 'ember-cp-validations';
import ValidationErrorDisplay from 'ilios/mixins/validation-error-display';
import { task } from 'ember-concurrency';

const { computed, Component, isEmpty, isPresent, RSVP } = Ember;
const { Promise } = RSVP;

const Validations = buildValidations({
  title: [
    validator('presence', true),
    validator('length', {
      min: 3,
      max: 200,
      descriptionKey: 'general.title'
    }),
  ]
});

export default Component.extend(ValidationErrorDisplay, Validations, {
  store: Ember.inject.service(),
  classNames: ['new-session', 'resultslist-new', 'form-container'],

  sessionTypes: null,

  title: null,
  selectedSessionTypeId: null,
  isSaving: false,

  activeSessionTypes: computed('sessionTypes.[]', async function() {
    const sessionTypes = await this.get('sessionTypes');
    return sessionTypes.filterBy('active', true);
  }),

  selectedSessionType: computed('activeSessionTypes.[]', 'selectedSessionTypeId', function(){
    return new Promise(resolve => {
      let selectedSessionType;
      this.get('sessionTypes').then(sessionTypes => {
        const selectedSessionTypeId = this.get('selectedSessionTypeId');
        if(isPresent(selectedSessionTypeId)){
          selectedSessionType = sessionTypes.find(sessionType => {
            return parseInt(sessionType.get('id')) === parseInt(selectedSessionTypeId);
          });
        }

        if (isEmpty(selectedSessionType)){
          //try and default to a type names 'Lecture';
          selectedSessionType = sessionTypes.find(sessionType => sessionType.get('title') === 'Lecture');
        }

        if(isEmpty(selectedSessionType)){
          selectedSessionType = sessionTypes.get('firstObject');
        }

        resolve(selectedSessionType);

      });
    });
  }),

  saveNewSession: task(function * () {
    const save = this.get('save');
    this.send('addErrorDisplayFor', 'title');
    const { validations } = yield this.validate();
    if (validations.get('isValid')) {
      const sessionType = yield this.get('selectedSessionType');
      let session = this.get('store').createRecord('session', {
        title: this.get('title'),
        sessionType
      });
      yield save(session);
      this.sendAction('cancel');
    }
  }),
});
