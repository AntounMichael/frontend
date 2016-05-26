import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';

const { Component } = Ember;

export default Component.extend({
  classNames: ['detail-block'],
  course: null,
  directors: null,
  saveChanges: task(function * () {
    yield timeout(10);  //small timeout so spinner has time to load
    const directors = this.get('directors');
    yield this.get('save')(directors);
  }).drop(),
  actions: {
    addDirector(user){
      this.get('directors').pushObject(user);
    },
    removeDirector(user){
      this.get('directors').removeObject(user);
    },
  }
});
