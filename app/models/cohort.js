import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string'),
  programYear: DS.belongsTo('program-year', {async: true}),
  courses: DS.hasMany('course', {async: true}),
  learnerGroups: DS.hasMany('learner-group', {async: true}),
  topLevelLearnerGroups: function(){
    return this.get('learnerGroups').then(function(groups){
      var parentHash = {};
      var groupHash = {};
      groups.forEach(function(group){
        groupHash[group.get('id')] = group;
        parentHash[group.get('id')] = group.get('parent');
      });
      return Ember.RSVP.hash(parentHash).then(function(hash){
        var topLevelGroups = Ember.A();
        for (var key in hash) {
          var parent = hash[key];
          if(parent == null){
            topLevelGroups.pushObject(groupHash[key]);
          }
        }
        return topLevelGroups;
      });
    });
  }.property('learnerGroups.@each'),
  displayTitle: '',
  displayTitleObserver: function(){
    var self = this;
    if(this.get('title.length') > 0){
      this.set('displayTitle', this.get('title'));
    } else {
      this.get('programYear').then(function(programYear){
        var title = Ember.I18n.t('programs.programYear.classOf', {year: programYear.get('classOfYear')});
        self.set('displayTitle', title);
      });
    }
  }.observes('title', 'programYear.classOfYear')
});
