// Upcoming events for Sled Finder, copied from the Rosebud Sled Museum website.
// Source of truth: https://rosebudsledmuseum.com/#upcoming
// (repo: jonspangler1-byte/rosebud-sled-museum, section id="upcoming" / #talks).
//
// Keep this file in sync when the website events section changes. Prefer publishing
// the same list as https://rosebudsledmuseum.com/events.json later so the app can
// fetch it; until that file exists (or if the fetch fails), this copy is used.
// Only real events from the site. Places are town / venue names as published — no
// added street addresses.
(function () {
  "use strict";
  const SOURCE = "https://rosebudsledmuseum.com/#upcoming";
  window.EVENTS_SOURCE = SOURCE;
  window.EVENTS_JSON = "https://rosebudsledmuseum.com/events.json";
  window.MUSEUM_EVENTS = [
    {
      id: "gail-borden-2027-01",
      kicker: "Display and opening talk",
      title: "Coasting Through History: America’s Antique Sleds and the Companies That Made Them",
      place: "Gail Borden Public Library (Main) · Elgin, Illinois",
      detail: "The display is on view 7–31 January 2027. The opening talk is Thursday, 7 January 2027, at 6:30 PM. Admission is free. The program lasts about 45–60 minutes, including Q&A, and will also be streamed on Zoom and recorded.",
      start: "2027-01-07",
      end: "2027-01-31",
      url: SOURCE
    },
    {
      id: "ela-library-2027-02-04",
      kicker: "Sled talk",
      title: "A show-and-tell with antique sleds",
      place: "Ela Area Public Library · Lake Zurich, Illinois",
      detail: "Thursday, 4 February 2027, 7–8 PM. A sled talk and show-and-tell with antique sleds from the collection.",
      start: "2027-02-04",
      end: "2027-02-04",
      url: SOURCE
    },
    {
      id: "rolling-meadows-2027-02-28",
      kicker: "Sled program",
      title: "Coasting Through History",
      place: "Rolling Meadows Historical Society (museum) · Rolling Meadows, Illinois",
      detail: "Sunday, 28 February 2027, 2–4 PM. A sled program with a display on the patio and Q&A.",
      start: "2027-02-28",
      end: "2027-02-28",
      url: SOURCE
    }
  ];
  window.EVENTS_LEDE = "Three public programs in the Chicago suburbs, beginning in January 2027.";
})();
