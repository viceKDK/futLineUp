/** Node's structured coverage event; never infer percentages from test counts. */
export default async function* coverageReporter(events) {
  for await (const event of events) {
    if (event.type === "test:coverage")
      yield JSON.stringify(event.data.summary, null, 2) + "\n";
  }
}
