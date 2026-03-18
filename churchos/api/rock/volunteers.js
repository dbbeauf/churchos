// api/rock/volunteers.js
const ROCK_API_URL = process.env.ROCK_API_URL;
const ROCK_API_KEY = process.env.ROCK_API_KEY;

const headers = { 'Authorization-Token': ROCK_API_KEY };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { dateMin, dateMax, suggest, team, serviceTime } = req.query;

  try {
    // Suggestion mode — return volunteers who have served on a given team
    if (suggest === 'true') {
      const url = `${ROCK_API_URL}/v2/Attendances?`
        + `$filter=Group/Name eq '${team}' and DidAttend eq true`
        + `&$select=PersonAlias,StartDateTime`
        + `&$expand=PersonAlias($expand=Person($select=Id,FirstName,LastName,Email,PhoneNumbers))`
        + `&$orderby=StartDateTime desc&$top=50`;

      const r = await fetch(url, { headers });
      const d = r.ok ? await r.json() : { value:[] };

      const seen = new Set();
      const suggestions = (d.value ?? [])
        .filter(a => a.PersonAlias?.Person)
        .filter(a => { const id = a.PersonAlias.Person.Id; if (seen.has(id)) return false; seen.add(id); return true; })
        .slice(0, 6)
        .map(a => ({
          id:          a.PersonAlias.Person.Id,
          firstName:   a.PersonAlias.Person.FirstName,
          lastName:    a.PersonAlias.Person.LastName,
          email:       a.PersonAlias.Person.Email,
          phone:       a.PersonAlias.Person.PhoneNumbers?.[0]?.NumberFormatted,
          primaryTeam: team,
          lastServed:  a.StartDateTime,
        }));

      return res.json({ suggestions });
    }

    // Normal schedule fetch
    const now = new Date();
    const start = dateMin || new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString().split('T')[0];
    const end   = dateMax || new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6).toISOString().split('T')[0];

    const url = `${ROCK_API_URL}/v2/GroupMembers?`
      + `$filter=Group/IsActive eq true and GroupMemberStatus eq '1' and Group/Schedule/StartDate ge datetime'${start}'`
      + `&$select=Id,GroupId,PersonId`
      + `&$expand=Group($select=Id,Name,Schedule),Person($select=Id,FirstName,LastName,Email,PhoneNumbers)`
      + `&$top=200`;

    const r = await fetch(url, { headers });
    const d = r.ok ? await r.json() : { value:[] };

    const schedule = (d.value ?? []).map(m => ({
      id:          m.Id,
      roleName:    'Volunteer',
      teamName:    m.Group?.Name ?? 'General',
      serviceTime: m.Group?.Schedule?.Name ?? 'Sunday',
      volunteer: m.Person ? {
        id:        m.Person.Id,
        firstName: m.Person.FirstName,
        lastName:  m.Person.LastName,
        email:     m.Person.Email,
        phone:     m.Person.PhoneNumbers?.[0]?.NumberFormatted,
      } : null,
      status: 'Confirmed',
    }));

    return res.json({ schedule, gaps: [], volunteers: [] });

  } catch (err) {
    console.error('[rock/volunteers]', err);
    return res.status(500).json({ error: err.message });
  }
};
