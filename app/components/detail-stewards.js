import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';

const { Component, RSVP, computed, inject, isEmpty, isPresent } = Ember;
const { map, all } = RSVP;
const { service } = inject;

export default Component.extend({
  store: service(),
  programYear: null,
  isManaging: false,
  bufferStewards: [],
  classNameBindings: [':detail-stewards', ':stewards-manager', 'showCollapsible:collapsible'],
  editable: true,

  showCollapsible: computed('isManaging', 'programYear.stewards.[]', function () {
    const isManaging = this.get('isManaging');
    const programYear = this.get('programYear');
    const stewardIds = programYear.hasMany('stewards').ids();
    return !isManaging && stewardIds.get('length');
  }),

  stewardsBySchool: computed('programYear.stewards.[]', async function(){
    const programYear = this.get('programYear');
    if (isEmpty(programYear)) {
      return [];
    }

    const stewards = await programYear.get('stewards');
    const stewardObjects = await map(stewards.toArray(), async steward => {
      const school = await steward.get('school');
      const department = await steward.get('department');
      const departmentId = isPresent(department)?department.get('id'):0;
      const departmentTitle = isPresent(department)?department.get('title'):null;
      return {
        schoolId: school.get('id'),
        schoolTitle: school.get('title'),
        departmentId,
        departmentTitle,
      };
    });
    const schools = stewardObjects.uniqBy('schoolId');
    const schoolData = schools.map(obj => {
      const departments = stewardObjects.filterBy('schoolId', obj.schoolId);
      const rhett = {
        schoolId: obj.schoolId,
        schoolTitle: obj.schoolTitle,
        departments
      };

      return rhett;
    });

    return schoolData;
  }),

  save: task( function * (){
    yield timeout(10);
    const programYear = this.get('programYear');
    const bufferStewards = this.get('bufferStewards');
    let stewards = yield programYear.get('stewards');
    let stewardsToRemove = stewards.filter(steward => !bufferStewards.includes(steward));
    let stewardsToAdd = bufferStewards.filter(steward => !stewards.includes(steward));
    stewardsToAdd.setEach('programYear', programYear);
    yield all(stewardsToRemove.invoke('destroyRecord'));
    yield all(stewardsToAdd.invoke('save'));
    this.set('isManaging', false);
    this.set('bufferStewards', []);
  }),

  manage: task( function * (){
    yield timeout(10);
    this.get('expand')();
    const stewards = yield this.get('programYear.stewards');
    this.set('bufferStewards', stewards.toArray());
    this.set('isManaging', true);
  }),
  actions: {
    collapse(){
      const programYear = this.get('programYear');
      const stewardIds = programYear.hasMany('stewards').ids();
      if (stewardIds.get('length')) {
        this.get('collapse')();
      }
    },
    cancel: function(){
      this.set('isManaging', false);
      this.set('bufferStewards', []);
    },
    addStewardToBuffer: function(steward){
      //copy the array to didReceiveAttrs gets called on detail-steward-manager
      let bufferStewards = this.get('bufferStewards').toArray();
      bufferStewards.pushObject(steward);
      this.set('bufferStewards', bufferStewards);
    },
    removeStewardFromBuffer: function(steward){
      //copy the array to didReceiveAttrs gets called on detail-steward-manager
      let bufferStewards = this.get('bufferStewards').toArray();
      bufferStewards.removeObject(steward);
      this.set('bufferStewards', bufferStewards);
    },
  }
});
