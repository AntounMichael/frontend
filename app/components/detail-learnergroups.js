import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';

const { Component, computed } = Ember;

export default Component.extend({
  init(){
    this._super(...arguments);
    this.get('loadLearnerGroups').perform();
  },
  didUpdateAttrs(){
    this._super(...arguments);
    this.get('loadLearnerGroups').perform();
  },
  classNames: ['detail-learnergroups'],
  tagName: 'div',
  subject: null,
  isIlmSession: false,
  editable: true,
  isManaging: false,
  learnerGroups: [],
  cohorts: [],
  loadLearnerGroups: task(function * (){
    const subject = this.get('subject');
    if (subject){
      let learnerGroups = yield subject.get('learnerGroups');
      this.set('learnerGroups', learnerGroups.toArray());
    } else {
      yield timeout(1000);
    }
  }).restartable(),
  save: task(function * (){
    yield timeout(10);
    let subject = this.get('subject');
    let learnerGroups = this.get('learnerGroups');
    subject.set('learnerGroups', learnerGroups);
    yield subject.save();
    this.get('setIsManaging')(false);
  }),
  collapsible: computed('isManaging', 'learnerGroups.length', function(){
    const isManaging = this.get('isManaging');
    const learnerGroups = this.get('learnerGroups');
    return learnerGroups.get('length') && ! isManaging;
  }),
  actions: {
    cancel(){
      this.get('loadLearnerGroups').perform();
      this.get('setIsManaging')(false);
    },
    addLearnerGroup: function(learnerGroup){
      let learnerGroups = this.get('learnerGroups').toArray();
      learnerGroups.addObject(learnerGroup);
      learnerGroup.get('allDescendants').then(function(descendants){
        learnerGroups.addObjects(descendants);
      });
      //re-create the object so we trigger downstream didReceiveAttrs
      this.set('learnerGroups', learnerGroups);
    },
    removeLearnerGroup: function(learnerGroup){
      let learnerGroups = this.get('learnerGroups').toArray();
      learnerGroups.removeObject(learnerGroup);
      learnerGroup.get('allDescendants').then(function(descendants){
        learnerGroups.removeObjects(descendants);
      });
      //re-create the object so we trigger downstream didReceiveAttrs
      this.set('learnerGroups', learnerGroups);
    }
  }
});
