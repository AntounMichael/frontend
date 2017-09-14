import Ember from 'ember';

const { Component, computed, inject, RSVP } = Ember;
const { service } = inject;
const { Promise, all } = RSVP;

export default Component.extend({
  i18n: service(),
  classNames: ['learnergroup-selection-manager'],
  filter: '',
  sortBy: ['title'],
  cohorts: [],
  learnerGroups: [],
  allLearnerGroups: computed('cohorts.[]', function(){
    return new Promise(resolve => {
      let cohorts = this.get('cohorts');
      all(cohorts.mapBy('rootLevelLearnerGroups')).then(allLearnerGroups => {
        let flat = allLearnerGroups.reduce((flattened, arr) => {
          return flattened.pushObjects(arr);
        }, []);

        resolve(flat);
      });
    });

  }),
  actions: {
    compareCohorts(cohort1, cohort2){
      return cohort1.get('id') === cohort2.get('id');
    }
  }
});
