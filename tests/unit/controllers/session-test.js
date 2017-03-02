import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('controller:session', 'Unit | Controller | Session ', {
  needs: ['service:iliosMetrics', 'service:headData'],
});

// Replace this with your real tests.
test('it exists', function(assert) {
  var controller = this.subject();
  assert.ok(controller);
});
