/* eslint ember/order-in-components: 0 */
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

const { notEmpty } = computed;

export default Component.extend({
  store: service(),
  school: null,
  tagName: 'section',
  classNames: ['school-session-types-expanded'],
  managedSessionTypeId: null,
  isManaging: notEmpty('managedSessionTypeId'),
  isCollapsible: computed('isManaging', 'school.session-types.length', async function(){
    const school = this.get('school');
    const isManaging = this.get('isManaging');
    const sessionTypes = await school.get('sessionTypes');

    return sessionTypes.get('length') && ! isManaging;
  }),
  sessionTypes: computed('school.sessionTypes.[]', async function(){
    const school = this.get('school');
    return await school.get('sessionTypes');
  }),
  managedSessionType: computed('managedSessionTypeId', async function(){
    const managedSessionTypeId = this.get('managedSessionTypeId');
    const sessionTypes = await this.get('sessionTypes');
    const sessionType = sessionTypes.findBy('id', managedSessionTypeId);

    return sessionType;
  }),
  save: task(function * (title, calendarColor, assessment, assessmentOption, aamcMethod, isActive) {
    const store = this.get('store');
    const sessionType = store.createRecord('sessionType');
    const closeComponent = this.get('setSchoolNewSessionType');
    const school = this.get('school');
    let aamcMethods = [];
    if (aamcMethod) {
      aamcMethods.pushObject(aamcMethod);
    }
    sessionType.setProperties({
      school,
      title,
      calendarColor,
      assessment,
      assessmentOption,
      aamcMethods,
      active: isActive
    });

    yield sessionType.save();
    closeComponent(false);
  }),
  actions: {
    async collapse(){
      const isCollapsible = this.get('isCollapsible');
      const collapse = this.get('collapse');
      const setSchoolManagedSessionType = this.get('setSchoolManagedSessionType');
      if (isCollapsible) {
        collapse();
        setSchoolManagedSessionType(null);
      }
    },
    cancel(){
      const setSchoolManagedSessionType = this.get('setSchoolManagedSessionType');
      setSchoolManagedSessionType(null);
    },
    toggleSchoolNewSessionType(){
      let schoolNewSessionType = this.get("schoolNewSessionType");
      let setSchoolNewSessionType = this.get("setSchoolNewSessionType");
      setSchoolNewSessionType(!schoolNewSessionType);
    }
  }
});
