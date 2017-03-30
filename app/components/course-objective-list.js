import Ember from 'ember';
import SortableObjectiveList from 'ilios/mixins/sortable-objective-list';

const { Component, computed } = Ember;
const { alias } = computed;

export default Component.extend(SortableObjectiveList, {
  classNames: ['course-objective-list'],
  objectivesForRemovalConfirmation: [],
  editable: true,
  course: alias('subject'),

  actions: {
    remove(objective){
      objective.deleteRecord();
      objective.save();
    },
    cancelRemove(objective){
      this.get('objectivesForRemovalConfirmation').removeObject(objective.get('id'));
    },
    confirmRemoval(objective){
      this.get('objectivesForRemovalConfirmation').pushObject(objective.get('id'));
    },
  }
});
