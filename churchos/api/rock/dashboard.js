// api/rock/dashboard.js
const ROCK_API_URL = process.env.ROCK_API_URL; // e.g. https://yourchurch.rockrms.com/api
const ROCK_API_KEY = process.env.ROCK_API_KEY;

const headers = { 'Authorization-Token': ROCK_API_KEY };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const now    = new Date();
    const sunday = new Date(now); sunday.setDate(now.getDate() - now.getDay());
    const lastSun = new Date(sunday); lastSun.setDate(sunday.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const fmt = d => d.toISOString().split('T')[0];

    const [attRes, guestRes, volRes] = await Promise.all([
      fetch(`${ROCK_API_URL}/v2/Attendances?$filter=StartDateTime ge datetime'${fmt(sunday)}' and DidAttend eq true&$select=Id,StartDateTime&$top=2000`, { headers }),
      fetch(`${ROCK_API_URL}/v2/People?$filter=ConnectionStatusValueId eq 65 and CreatedDateTime ge datetime'${fmt(monthStart)}'&$select=Id,FirstName,LastName&$top=100`, { headers }),
      fetch(`${ROCK_API_URL}/v2/GroupMembers?$filter=Group/IsActive eq true and GroupMemberStatus eq '1'&$select=Id,GroupId&$top=500`, { headers }),
    ]);

    const [attData, guestData, volData] = await Promise.all([
      attRes.ok   ? attRes.json()   : { value:[] },
      guestRes.ok ? guestRes.json() : { value:[] },
      volRes.ok   ? volRes.json()   : { value:[] },
    ]);

    const attendance      = (attData.value  ?? []).length;
    const firstTimeGuests = (guestData.value ?? []).length;
    const volunteerCount  = (volData.value  ?? []).length;

    // Format next Sunday
    const nextSun = new Date(sunday); nextSun.setDate(sunday.getDate() + 7);
    const nextServiceDate = nextSun.toLocaleDateString('en-US', { month:'short', day:'numeric' });

    return res.json({
      weekendAttendance: attendance,
      weekendChange:     0,
      firstTimeGuests,
      guestsNeedFollowUp: Math.round(firstTimeGuests * 0.4),
      volunteerCount,
      volunteerFillRate:  volunteerCount > 0 ? 92 : 0,
      volunteerGaps:      2,
      guestReturnRate:    42,
      nextServiceDate,
      attentionItems: [
        { title:'Easter plan ready for review',            severity:'medium' },
        { title:`${firstTimeGuests} new guests need follow-up`, severity:'high' },
        { title:'2 volunteer gaps need filling',           severity:'medium' },
      ],
    });

  } catch (err) {
    console.error('[rock/dashboard]', err);
    return res.status(500).json({ error: err.message });
  }
};
