import RSVP from 'rsvp';
import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

const { resolve } = RSVP;

moduleForComponent('session-objective-list', 'Integration | Component | session objective list', {
  integration: true
});

test('it renders', function(assert){
  assert.expect(7);

  let objective1 = EmberObject.create({
    title: 'Objective A',
    position: 0,
    hasMany() {
      return {
        ids() {
          return [];
        }
      };
    }
  });

  let objective2 = EmberObject.create({
    title: 'Objective B',
    position: 0,
    hasMany() {
      return {
        ids() {
          return [];
        }
      };
    }
  });

  let objectives = [ objective1, objective2 ];

  let session = EmberObject.create({
    sortedObjectives: resolve(objectives),
  });

  this.on('nothing', parseInt);
  this.set('subject', session);

  this.render(
    hbs`{{session-objective-list editable=true subject=subject manageParents=(action 'nothing') manageDescriptors=(action 'nothing')}}`
  );
  return wait().then(() => {
    assert.ok(this.$('.sort-materials-btn').length, 'Sort Objectives button is visible');
    assert.equal(this.$('thead th:eq(0)').text().trim(), 'Description');
    assert.equal(this.$('thead th:eq(1)').text().trim(), 'Parent Objectives');
    assert.equal(this.$('thead th:eq(2)').text().trim(), 'MeSH Terms');
    assert.equal(this.$('thead th:eq(3)').text().trim(), 'Actions');
    for (let i = 0, n = objectives.length; i < n; i++) {
      let objective = objectives[i];
      assert.equal(this.$(`tbody tr:eq(${i}) td:eq(0)`).text().trim(), objective.get('title'));
    }
  });
});

test('empty list', function(assert){
  assert.expect(2);
  let session = EmberObject.create({
    objectives: resolve([]),
  });
  this.set('subject', session);
  this.render(hbs`{{session-objective-list subject=subject}}`);
  return wait().then(() => {
    let container = this.$('.session-objective-list');
    assert.equal(container.length, 1, 'Component container element exists.');
    assert.equal(container.text().trim(), '', 'No content is shown.');
  });
});

test('no "sort objectives" button in list with one item', function(assert){
  assert.expect(2);
  let objective = EmberObject.create({
    title: 'Objective A',
    hasMany() {
      return {
        ids() {
          return [];
        }
      };
    }
  });
  let session = EmberObject.create({
    sortedObjectives: resolve([ objective ]),
  });

  this.on('nothing', parseInt);
  this.set('subject', session);

  this.render(
    hbs`{{session-objective-list editable=true subject=subject manageParents=(action 'nothing') manageDescriptors=(action 'nothing')}}`
  );

  return wait().then(() => {
    assert.notOk(this.$('.sort-materials-btn').length, 'Sort button is not visible');
    assert.equal(this.$('tbody tr:eq(0) td:eq(0)').text().trim(), objective.get('title'), 'Objective is visible');
  });
});


