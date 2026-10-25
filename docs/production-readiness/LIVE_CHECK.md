# Live check

Run: 2026-10-25T09:55:08.133Z against http://localhost:5173 (API http://localhost:8190/api), school GVPS.

**37 of 37 checks passed.**


## 1. Notices from the office reach only their audience

- PASS: students see a notice sent to Students
- PASS: parents do NOT see the notice sent to Students
- PASS: teachers do NOT see the notice sent to Students
- PASS: parents see a notice sent to Parents
- PASS: students do NOT see the notice sent to Parents

## 2. Homework given by a teacher reaches exactly the right students

- PASS: student Riya sees the class homework
- PASS: student Riya sees the homework meant only for her
- PASS: parent (child Riya) sees both
- PASS: classmate Kabir sees the class homework but NOT the one for Riya _(API as Kabir)_
- PASS: classmate Aarav sees the class homework but NOT the one for Riya _(API as Aarav)_
- PASS: the parent switching to Kabir no longer sees the homework meant for Riya
- PASS: the school office sees the homework of every teacher
- PASS: the student marks it done and the teacher sees the count rise

## 3. Attendance marked by the teacher shows for the student and the parent

- PASS: the student sees the absence on My Attendance _(screen + API)_
- PASS: the parent sees the same absence for Riya _(screen + API)_
- PASS: the office attendance report counts the school day _(screen + API)_

## 4. A fee recorded by the office shows for the student and the parent only

- PASS: the office records the payment _(API as the office)_
- PASS: the student sees the payment on Fee Status
- PASS: the parent is told "Fee payment received"
- PASS: another student (Aarav) sees nothing about it

## 5. Messages go to the right person, with a photo

- PASS: the teacher gets the message from the parent
- PASS: the parent gets the teacher's reply
- PASS: the student does not see the parent's conversation
- PASS: a student has no "Concerns" tab (it is for parents and staff)

## 6. A concern raised by the teacher goes to the child's parent only

- PASS: the parent sees the concern under Chat > Concerns
- PASS: the parent can reply and the status changes
- PASS: the concern is held for Riya's parent, with the school's name on it _(API)_

## 7. A profile photo set by the student shows to the people who look at them

- PASS: the student sees it on their own profile and header
- PASS: the teacher sees it in the chat list
- PASS: the office student list shows the photo _(API as the office)_

## 8. The school bus, live

- PASS: before the trip, the student sees "not on route"
- PASS: the student sees the bus LIVE on the map
- PASS: the parent sees the same bus LIVE
- PASS: the home dashboard says "On route now" only now
- PASS: after the trip ends the student sees "not on route" again

## 9. Another school sees none of this

- PASS: AISCHAKAND (another school) has none of today's notices _(API, support session)_
- PASS: AISCHAKAND sees none of the homework _(API, support session)_
