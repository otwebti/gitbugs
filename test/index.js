var fs = require('fs'),
  path = require('path'),
  nopt = require('nopt'),
  assert = require('assert'),
  GitBugs = require('../'),
  events = require('events');

var opts = nopt();
var gb = new GitBugs({ cwd: path.resolve('.test') });
assert.ok(gb instanceof events.EventEmitter);
assert.ok(GitBugs() instanceof events.EventEmitter);

assert.equal(gb.path(), path.resolve('.test/.gitbugs'));

// init

gb.init(next('init', [
  /initialized\s(existing|empty)?\sGit\srepository\sin/i,
  'in '+path.resolve()+'/.test/.gitbugs/.git/'
]));

gb.on('error', function(er) { console.error(er); });

gb.and(function() {

  // repo init go

  // list
  gb.list(next('list with no issue opened'));

  // create
  var title = 'This is a new issue';

  gb.create('This is a new issue', { title: title, desc: title }, next('create a new issue', 'This is a new issue')).and(function() {
    gb.list(next('list with no args')).and(function(er, files) {
      assert.ifError(er);
      assert.equal(files.length, 1);
      var issue = files[0];
      assert.equal(issue.id, '#1');
      assert.equal(issue.file, '1-this-is-a-new-issue.md');
      assert.equal(issue.title.trim(),'This is a new issue');
    });

    gb.get(1, function(er, issue) {
      assert.ifError(er);
      assert.equal(issue.id, 1);
      assert.equal(issue.file, '1-this-is-a-new-issue.md');
      assert.equal(issue.content, '\nThis is a new issue');
      assert.equal(issue.title,'This is a new issue');
    }).and(function(er, issue) {
      assert.ifError(er);
      assert.equal(issue.id, 1);
      assert.equal(issue.file, '1-this-is-a-new-issue.md');
      assert.equal(issue.content, '\nThis is a new issue');
      assert.equal(issue.title,'This is a new issue');
    });

    gb.get(807987, error('get', 'No issue #807987'));

    gb.close(1, next('close', 'Close #1')).and(function () {
            title = 'This is another new issue';
            gb.and(function () {
                gb.create('This is another new issue', { title: title, desc: title }, next('create another new issue', 'This is another new issue')).and(function () {
                    gb.list(next('New issue id is greater than deleted issue id')).and(function (er, files) {
                        assert.ifError(er);
                        assert.equal(files.length, 1, 'Creating another new issue should show 1 issue in list');
                        var issue = files[0];

                        assert.equal(issue.id, '#2', 'New issue id shoud be greater than deleted issue id');
                        assert.equal(issue.file, '2-this-is-another-new-issue.md');
                        assert.equal(issue.title.trim(), 'This is another new issue');
                    });
                })
            });

        });
  });
});

// next handler, takes a topic, returns a function.
function next(topic, outputs) {
  if(!opts.debug) var to = setTimeout(function() { assert.fail(' ✗ Timeout Error: ', topic); }, 2000);
  outputs = Array.isArray(outputs) ? outputs : [outputs];
  return function(er, stdout, stderr) {
    assert.ifError(er);
    if(!opts.debug) clearTimeout(to);

    outputs.forEach(function(reg) {
      reg = typeof reg === 'string' ? new RegExp(reg) : reg;
      var msg = '\n Expected   - ' + reg + '.\n Was        - ' + stdout;
      if(reg) assert.ok(reg.test(stdout), msg);
    });

    console.log(' ✔ ' + topic + ' OK.');
  };
}

// same as next, but checks that the given error is passed
function error(topic, reg) {
  if(!opts.debug) var to = setTimeout(function() { assert.fail(' ✗ Timeout Error: ', topic); }, 2000);
  return function(er, stdout, stderr) {
    if(!opts.debug) clearTimeout(to);
    reg = typeof reg === 'string' ? new RegExp(reg) : reg;
    var msg = '\n Expected   - ' + reg + '.\n Was        - ' + er.stack;
    if(reg) assert.ok(reg.test(er.stack), msg);

    console.log(' ✔ ' + topic + ' OK.');
  };
}

