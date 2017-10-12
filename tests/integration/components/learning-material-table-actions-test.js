import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('learning-material-table-actions', 'Integration | Component | learning material table actions', {
  integration: true
});

test('it renders', function(assert) {
  const row = EmberObject.create({
    confirmDelete: false
  });
  const deleteIcon = 'i.fa-trash';

  this.set('row', row);
  this.render(hbs`{{learning-material-table-actions row=row}}`);
  assert.equal(this.$(deleteIcon).length, 1);
});

test('it does not display an icon when it should not', function(assert) {
  const row = EmberObject.create({
    confirmDelete: true
  });
  const deleteIcon = 'i.fa-trash';

  this.set('row', row);
  this.render(hbs`{{learning-material-table-actions row=row}}`);
  assert.equal(this.$(deleteIcon).length, 0);
});

test('clicking delete changes the row property', function(assert) {
  const row = EmberObject.create({
    confirmDelete: false,
    expanded: false
  });
  const deleteIcon = 'i.fa-trash';

  this.set('row', row);
  this.render(hbs`{{learning-material-table-actions row=row}}`);
  assert.equal(this.$(deleteIcon).length, 1);
  this.$(deleteIcon).click();
  assert.ok(row.get('confirmDelete'));
  assert.ok(row.get('expanded'));
});
