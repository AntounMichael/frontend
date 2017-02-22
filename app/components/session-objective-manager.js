import Ember from 'ember';

const { Component, computed, ObjectProxy, RSVP} = Ember;
const { Promise } = RSVP;

const objectiveProxy = ObjectProxy.extend({
  sessionObjective: null,
  selected: computed('content', 'sessionObjective.parents.[]', function(){
    return this.get('sessionObjective.parents').includes(this.get('content'));
  }),
});

export default Component.extend({
  classNames: ['objective-manager'],
  sessionObjective: null,
  course: computed('sessionObjective.courses.[]', function(){
    return new Promise(resolve => {
      let sessionObjective = this.get('sessionObjective');
      if(!sessionObjective){
        resolve(null);
        return;
      }
      sessionObjective.get('sessions').then(function(sessions){
        let session =  sessions.get('firstObject');
        session.get('course').then(function(course){
          resolve(course);
        });
      });
    });
  }),
  proxiedObjectives: computed('course', 'course.objectives.[]', function(){
    return new Promise(resolve => {
      let sessionObjective = this.get('sessionObjective');
      if(!sessionObjective){
        resolve([]);
        return;
      }
      this.get('course').then(function(course){
        if(!course){
          resolve([]);
          return;
        }
        course.get('objectives').then(function(objectives){
          let objectiveProxies = objectives.map(function(objective){
            return objectiveProxy.create({
              content: objective,
              sessionObjective: sessionObjective,
            });
          });
          resolve(objectiveProxies.sortBy('id'));
        });
      });
    });
  }),

  showObjectiveList: computed('proxiedObjectives.[]', function() {
    return new Promise(resolve => {
      this.get('proxiedObjectives').then(objectives => {
        resolve(objectives.length > 0);
      });
    });
  }),

  actions: {
    addParent: function(parentProxy){
      let newParent = parentProxy.get('content');
      let sessionObjective = this.get('sessionObjective');
      sessionObjective.get('parents').addObject(newParent);
      newParent.get('children').addObject(sessionObjective);
    },
    removeParent: function(parentProxy){
      let removingParent = parentProxy.get('content');
      let sessionObjective = this.get('sessionObjective');
      sessionObjective.get('parents').removeObject(removingParent);
      removingParent.get('children').removeObject(sessionObjective);
    }
  }
});
