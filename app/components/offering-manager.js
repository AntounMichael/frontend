import Ember from 'ember';

const { Component, computed, inject, isEmpty, RSVP } = Ember;
const { Promise } = RSVP;
const { service } = inject;


export default Component.extend({
  currentUser: service(),
  classNames: ['offering-manager'],
  offering: null,
  editable: true,

  isEditing: false,
  showRemoveConfirmation: false,

  userCanDelete: computed('offering.session.course', 'offering.allInstructors.[]', 'currentUser.model.directedCourses.[]', function(){
    const offering = this.get('offering');
    return new Promise(resolve => {
      if (isEmpty(offering)) {
        resolve(false);
      } else {
        this.get('currentUser.userIsDeveloper').then(isDeveloper => {
          if(isDeveloper){
            resolve(true);
          } else {
            this.get('currentUser.model').then(user => {
              offering.get('allInstructors').then(allInstructors => {
                if(allInstructors.contains(user)){
                  resolve(true);
                } else {
                  offering.get('session').then(session => {
                    session.get('course').then(course => {
                      user.get('directedCourses').then(directedCourses => {
                        resolve(directedCourses.contains(course));
                      });
                    });
                  });
                }
              });
            });
          }
        });
      }

    });
  }),

  actions: {
    save(startDate, endDate, room, learnerGroups, instructorGroups, instructors){
      const offering = this.get('offering');
      offering.setProperties({startDate, endDate, room, learnerGroups, instructorGroups, instructors});

      return offering.save();
    },
    remove: function(){
      this.sendAction('remove', this.get('offering'));
    },
    cancelRemove: function(){
      this.set('showRemoveConfirmation', false);
    },
    confirmRemove: function(){
      this.set('showRemoveConfirmation', true);
    },
  }
});
