/* =========================================================
   Alpha Books — your inventory
   ---------------------------------------------------------
   Edit this file to manage what is on the shelf. The catalogue
   rebuilds itself from this list.

   Fields:
     isbn          ISBN (with or without dashes)
     title         book title
     author        author(s); leave "" if you are not sure
     edition       e.g. "Eighth edition"
     year          year of publication
     condition     Excellent / Good / Average / Acceptable
     blurb         the listing comment; note any special defects here
     priceLocal   TOTAL including local Hatfield delivery or collection
     priceCourier  TOTAL including courier anywhere in SA
     cover         leave "" to load the cover automatically from the ISBN,
                   or paste an image URL to override it

   Prices below are taken from the Payout column on your account, with a
   courier option set R60 higher. Adjust them to whatever you want to charge.
   To fill in a missing author or cover, run the ISBN through the
   "Find a book by ISBN" box on the Sell page and paste the result here.
   ========================================================= */

const BOOKS = [
  {
    isbn: "9780071422949",
    title: "Perry's Chemical Engineers' Handbook",
    author: "Don Green, Robert Perry (eds.)",
    edition: "Eighth edition",
    year: "2007",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 544,
    priceCourier: 604,
    cover: ""
  },
  {
    isbn: "9780639008929",
    title: "Business Law",
    author: "",
    edition: "Sixth edition",
    year: "2020",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 663,
    priceCourier: 723,
    cover: ""
  },
  {
    isbn: "9789814595278",
    title: "Heat and Mass Transfer in SI Units",
    author: "Yunus Cengel, Afshin Ghajar",
    edition: "Fifth edition",
    year: "2015",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 758,
    priceCourier: 818,
    cover: ""
  },
  {
    isbn: "9780538498876",
    title: "Calculus: Early Transcendentals (International Metric Edition)",
    author: "James Stewart",
    edition: "Seventh edition",
    year: "2011",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 353,
    priceCourier: 413,
    cover: ""
  },
  {
    isbn: "9781305970632",
    title: "Differential Equations with Boundary-Value Problems (International Metric Edition)",
    author: "Dennis G. Zill",
    edition: "Eighth edition",
    year: "2016",
    condition: "Average",
    blurb: "Some writing or highlighting inside. No missing pages and fully readable.",
    priceLocal: 240,
    priceCourier: 300,
    cover: ""
  },
  {
    isbn: "9781787260139",
    title: "The Impact of Engineering on Society: A Multidisciplinary Approach",
    author: "",
    edition: "Third edition",
    year: "2023",
    condition: "Average",
    blurb: "Some writing or highlighting inside. No missing pages and fully readable.",
    priceLocal: 378,
    priceCourier: 438,
    cover: ""
  },
  {
    isbn: "9789814581882",
    title: "Organic Chemistry",
    author: "",
    edition: "Fourth edition",
    year: "2014",
    condition: "Average",
    blurb: "Some writing or highlighting inside. No missing pages and fully readable.",
    priceLocal: 782,
    priceCourier: 842,
    cover: ""
  },
  {
    isbn: "9780534380588",
    title: "Operations Research: Applications and Algorithms",
    author: "Wayne L. Winston",
    edition: "Fourth edition",
    year: "2003",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 471,
    priceCourier: 531,
    cover: ""
  },
  {
    isbn: "9780077169527",
    title: "Operations Management (Global Edition)",
    author: "",
    edition: "Twelfth edition",
    year: "2014",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 847,
    priceCourier: 907,
    cover: ""
  },
  {
    isbn: "9781305859975",
    title: "Supply Chain Management: A Logistics Perspective",
    author: "",
    edition: "Tenth edition",
    year: "2016",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 330,
    priceCourier: 390,
    cover: ""
  },
  {
    isbn: "9780470444047",
    title: "Facilities Planning",
    author: "",
    edition: "Fourth edition",
    year: "2010",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 321,
    priceCourier: 381,
    cover: ""
  },
  {
    isbn: "9780495125709",
    title: "Principles of Instrumental Analysis (International Edition)",
    author: "Skoog, Holler, Crouch",
    edition: "Sixth edition",
    year: "2006",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 320,
    priceCourier: 380,
    cover: ""
  },
  {
    isbn: "9781118808870",
    title: "Fundamentals of Momentum, Heat and Mass Transfer",
    author: "Welty, Wicks, Wilson, Rorrer",
    edition: "Sixth edition",
    year: "2014",
    condition: "Excellent",
    blurb: "Worn from normal use but no torn or missing pages, and no writing or highlighting.",
    priceLocal: 357,
    priceCourier: 417,
    cover: ""
  }
];
