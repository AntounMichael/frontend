import Ember from 'ember';
import moment from 'moment';
import { validator, buildValidations } from 'ember-cp-validations';
import ValidationErrorDisplay from 'ilios/mixins/validation-error-display';
import { task, timeout } from 'ember-concurrency';

const { Component, inject, computed, RSVP, isPresent, isEmpty } = Ember;
const { service } = inject;
const { Promise, map, filter, hash } = RSVP;

const Validations = buildValidations({
  room: [
    validator('presence', {
      presence: true
    }),
    validator('length', {
      max: 255
    }),
  ],
  numberOfWeeks: {
    dependentKeys: ['makeRecurring'],
    disabled(){
      return !this.get('model.makeRecurring');
    },
    validators: [
      validator('presence', {
        presence: true
      }),
      validator('number', {
        allowString: true,
        integer: true,
        gt: 0,
      }),
    ]
  },
  durationHours: [
    validator('number', {
      allowString: true,
      integer: true,
      gte: 0
    })
  ],
  durationMinutes: [
    validator('number', {
      allowString: true,
      integer: true,
      gte: 0,
      lte: 60
    })
  ],
  learnerGroups: {
    dependentKeys: ['smallGroupMode'],
    disabled(){
      return !this.get('model.smallGroupMode');
    },
    validators: [
      validator('length', {
        min: 1,
        messageKey: 'offerings.smallGroupMessage'
      })
    ]
  },

});

export default Component.extend(ValidationErrorDisplay, Validations, {
  currentUser: service(),
  didReceiveAttrs(){
    this._super(...arguments);
    const offering = this.get('offering');
    if (isPresent(offering)) {
      this.get('loadAttrsFromOffering').perform(offering);
    } else {
      this.loadDefaultAttrs();
    }
  },
  classNames: ['offering-form'],
  startDate: null,
  endDate: null,
  room: 'TBD',
  cohorts: null,
  learnerGroups: null,
  showRoom: false,
  showMakeRecurring: false,
  showInstructors: false,
  makeRecurring: false,
  recurringDays: null,
  numberOfWeeks: 1,
  instructors: null,
  instructorGroups: null,
  courseStartDate: null,
  courseEndDate: null,
  smallGroupMode: false,
  offeringsToSave: 0,
  savedOfferings: 0,
  recurringDayOptions: [
    {day: '0', t: 'offerings.sunday'},
    {day: '1', t: 'offerings.monday'},
    {day: '2', t: 'offerings.tuesday'},
    {day: '3', t: 'offerings.wednesday'},
    {day: '4', t: 'offerings.thursday'},
    {day: '5', t: 'offerings.friday'},
    {day: '6', t: 'offerings.saturday'},
  ],
  associatedSchools: computed('cohorts.[]', function(){
    return new Promise(resolve => {
      const cohorts = this.get('cohorts');
      if (isEmpty(cohorts)) {
        resolve([]);
      } else {
        map(cohorts.toArray(), cohort => {
          return cohort.get('school');
        }).then(cohortSchools => {
          let schools = [];
          schools.pushObjects(cohortSchools);
          resolve(schools.uniq().toArray());
        });
      }
    });
  }),
  availableInstructorGroups: computed('associatedSchools.[]', function(){
    return new Promise(resolve => {
      this.get('associatedSchools').then(associatedSchools => {
        map(associatedSchools, school => {
          return school.get('instructorGroups');
        }).then(allInstructorGropus => {
          let flat = allInstructorGropus.reduce((flattened, obj) => {
            return flattened.pushObjects(obj.toArray());
          }, []);

          resolve(flat);
        });
      });
    });
  }),
  defaultStartDate: computed('courseStartDate', 'courseEndDate', function(){
    const today = moment();
    const courseStartDate = this.get('courseStartDate');
    const courseEndDate = this.get('courseEndDate');
    let defaultStartDate = today.clone();
    if (isPresent(courseStartDate) && today.isBefore(courseStartDate)) {
      defaultStartDate = moment(courseStartDate);
    }
    if (isPresent(courseEndDate) && today.isAfter(courseEndDate)) {
      defaultStartDate = moment(courseEndDate);
    }

    return defaultStartDate.toDate();
  }),
  durationHours: computed('startDate', 'endDate', function(){
    const startDate = this.get('startDate');
    const endDate = this.get('endDate');

    if (isEmpty(startDate) || isEmpty(endDate)) {
      return 1;
    }
    let mStart = moment(startDate);
    let mEnd = moment(endDate);
    let diffInHours = mEnd.diff(mStart, 'hours');

    return diffInHours;
  }),
  durationMinutes: computed('startDate', 'endDate', function(){
    const startDate = this.get('startDate');
    const endDate = this.get('endDate');

    if (isEmpty(startDate) || isEmpty(endDate)) {
      return 0;
    }
    let mStart = moment(startDate);
    let mEnd = moment(endDate);

    const endHour = mEnd.hour();
    const endMinute = mEnd.minute();

    mStart.hour(endHour);
    const startMinute = mStart.minute();

    return endMinute - startMinute;
  }),
  makeRecurringOfferingObjects: task(function * () {
    const {
      startDate,
      endDate,
      room,
      instructorGroups,
      instructors,
      numberOfWeeks,
      recurringDays
    } = this.getProperties('startDate', 'endDate', 'room', 'instructorGroups', 'instructors', 'numberOfWeeks', 'recurringDays');
    const makeRecurring = this.get('makeRecurring');
    const learnerGroups = yield this.get('lowestLearnerGroupLeaves');
    let offerings = [];
    offerings.push({startDate, endDate, room, learnerGroups, instructorGroups, instructors});
    if (!makeRecurring) {
      return offerings;
    }

    const userPickedDay = moment(startDate).day();
    //convert strings to numbers use parseFloat because parseInt takes a second
    //argument and gets thrown off by map sending that argument as the counter
    const recurringDayInts = recurringDays.map(parseFloat).sort();

    // Add offerings for the rest of first week
    //only days AFTER the initial day are considered
    recurringDayInts.forEach(day => {
      if (day > userPickedDay) {
        let obj = {room, learnerGroups, instructorGroups, instructors};
        obj.startDate = moment(startDate).day(day).toDate();
        obj.endDate = moment(endDate).day(day).toDate();

        offerings.push(obj);
      }
    });
    recurringDayInts.pushObject(userPickedDay);
    recurringDayInts.sort();

    for (let i = 1; i < numberOfWeeks; i++) {
      recurringDayInts.forEach(day => {
        let obj = {room, learnerGroups, instructorGroups, instructors};
        obj.startDate = moment(startDate).day(day).add(i, 'weeks').toDate();
        obj.endDate = moment(endDate).day(day).add(i, 'weeks').toDate();

        offerings.push(obj);
      });
    }

    return offerings;
  }),
  makeSmallGroupOfferingObjects(offerings){
    const smallGroupMode = this.get('smallGroupMode');
    if (!smallGroupMode) {
      return offerings;
    }

    let smallGroupOfferings = [];

    offerings.forEach(({startDate, endDate, room, learnerGroups, instructorGroups, instructors}) => {
      learnerGroups.forEach(learnerGroup => {
        let offering = {startDate, endDate, room, instructorGroups, instructors};
        offering.learnerGroups = [learnerGroup];

        smallGroupOfferings.pushObject(offering);
      });
    });

    return smallGroupOfferings;
  },


  loadDefaultAttrs(){
    let startDate = moment(this.get('defaultStartDate')).hour(8).minute(0).second(0).toDate();
    let endDate = moment(this.get('defaultStartDate')).hour(9).minute(0).second(0).toDate();
    const room = 'TBD';
    const learnerGroups = [];
    const recurringDays = [];
    const instructors = [];
    const instructorGroups = [];

    this.setProperties({startDate, endDate, room, learnerGroups, recurringDays, instructors, instructorGroups});
  },

  loadAttrsFromOffering: task(function * (offering) {
    const startDate = offering.get('startDate');
    const endDate = offering.get('endDate');
    const room = offering.get('room');
    const recurringDays = [];
    let obj = yield hash({
      learnerGroups : offering.get('learnerGroups'),
      instructors : offering.get('instructors'),
      instructorGroups : offering.get('instructorGroups'),
    });
    const learnerGroups = obj.learnerGroups.toArray();
    const instructors = obj.instructors.toArray();
    const instructorGroups = obj.instructorGroups.toArray();

    this.setProperties({startDate, endDate, room, learnerGroups, recurringDays, instructors, instructorGroups});
  }),
  saveOffering: task(function * () {
    this.set('offeringsToSave', 0);
    this.set('savedOfferings', 0);
    this.send('addErrorDisplaysFor', ['room', 'numberOfWeeks', 'durationHours', 'durationMinutes', 'learnerGroups']);
    yield timeout(10);
    let {validations} = yield this.validate();

    if (validations.get('isInvalid')) {
      return;
    }
    let offerings = yield this.get('makeRecurringOfferingObjects').perform();
    offerings = this.makeSmallGroupOfferingObjects(offerings);

    this.set('offeringsToSave', offerings.length);
    //save offerings in sets of 5
    let parts;
    while (offerings.length > 0){
      parts = offerings.splice(0, 5);
      yield map(parts, ({startDate, endDate, room, learnerGroups, instructorGroups, instructors}) => {
        return this.get('save')(startDate, endDate, room, learnerGroups, instructorGroups, instructors);
      });
      this.set('savedOfferings', this.get('savedOfferings') + parts.length);
    }
    this.send('clearErrorDisplay');
    this.get('close')();

  }),
  validateThenSaveOffering: task(function * () {
    this.send('addErrorDisplaysFor', ['room', 'numberOfWeeks', 'durationHours', 'durationMinutes', 'learnerGroups']);
    let {validations} = yield this.validate();

    if (validations.get('isInvalid')) {
      return;
    }

    yield this.get('saveOffering').perform();
  }),
  lowestLearnerGroupLeaves: computed('learnerGroups.[]', function(){
    const learnerGroups = this.get('learnerGroups');
    const ids = learnerGroups.mapBy('id');
    return new Promise(resolve => {
      filter(learnerGroups, group => {
        return new Promise(resolve => {
          group.get('allDescendants').then(children => {
            let selectedChildren = children.filter(child => ids.contains(child.get('id')));
            resolve(selectedChildren.length === 0);
          });
        });
      }).then(lowestLeaves => resolve(lowestLeaves));
    });
  }),
  updateDurationMinutes: task(function * (minutes) {
    let {validations} = yield this.validate();
    this.send('addErrorDisplayFor', 'durationMinutes');

    if (validations.get('durationMinutes.isInvalid')) {
      return;
    }
    const hours = this.get('durationHours');
    const startDate = moment(this.get('startDate'));
    let endDate = startDate.clone().add(hours, 'hours').add(minutes, 'minutes').toDate();
    yield timeout(250);
    this.set('endDate', endDate);
  }).restartable(),
  updateDurationHours: task(function * (hours) {
    let {validations} = yield this.validate();
    this.send('addErrorDisplayFor', 'durationHours');

    if (validations.get('durationHours.isInvalid')) {
      return;
    }
    const minutes = this.get('durationMinutes');
    const startDate = moment(this.get('startDate'));
    let endDate = startDate.clone().add(hours, 'hours').add(minutes, 'minutes').toDate();
    yield timeout(250);
    this.set('endDate', endDate);
  }).restartable(),
  actions: {
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
    },
    toggleRecurringDay(day){
      let recurringDays = this.get('recurringDays');
      if (recurringDays.contains(day)) {
        recurringDays.removeObject(day);
      } else {
        recurringDays.pushObject(day);
      }
    },
    addInstructor(user){
      let instructors = this.get('instructors').toArray();
      instructors.addObject(user);
      //re-create the object so we trigger downstream didReceiveAttrs
      this.set('instructors', instructors);
    },
    addInstructorGroup(group){
      let instructorGroups = this.get('instructorGroups').toArray();
      instructorGroups.addObject(group);
      //re-create the object so we trigger downstream didReceiveAttrs
      this.set('instructorGroups', instructorGroups);
    },
    removeInstructor(user){
      let instructors = this.get('instructors').toArray();
      instructors.removeObject(user);
      //re-create the object so we trigger downstream didReceiveAttrs
      this.set('instructors', instructors);
    },
    removeInstructorGroup(group){
      let instructorGroups = this.get('instructorGroups').toArray();
      instructorGroups.removeObject(group);
      //re-create the object so we trigger downstream didReceiveAttrs
      this.set('instructorGroups', instructorGroups);
    },
    updateStartTime(value, type) {
      let startDate = moment(this.get('startDate'));

      if (type === 'hour') {
        startDate.hour(value);
      } else {
        startDate.minute(value);
      }
      const minutes = this.get('durationMinutes');
      const hours = this.get('durationHours');
      let endDate = startDate.clone().add(hours, 'hours').add(minutes, 'minutes');

      this.set('startDate', startDate.toDate());
      this.set('endDate', endDate.toDate());
    },
    updateStartDate(date) {
      const minutes = this.get('durationMinutes');
      const hours = this.get('durationHours');
      const currentStartDate = moment(this.get('startDate'));
      let startDate = moment(date).hour(currentStartDate.hour()).minute(currentStartDate.minute()).toDate();
      let endDate = moment(startDate).add(hours, 'hours').add(minutes, 'minutes').toDate();

      this.setProperties({startDate, endDate});
    },
  }
});
