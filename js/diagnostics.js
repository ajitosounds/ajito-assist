(() => {
  "use strict";
  function createSession(id='diagnostic') {
    return {id, started_at:new Date().toISOString(), answers:[], completed:false};
  }
  function record(session, questionId, answer) {
    session.answers.push({question_id:questionId, answer, at:new Date().toISOString()});
    return session;
  }
  function complete(session, result) {
    session.completed = true;
    session.result = result;
    session.completed_at = new Date().toISOString();
    return session;
  }
  window.AJITODiagnostics = {createSession, record, complete};
})();
