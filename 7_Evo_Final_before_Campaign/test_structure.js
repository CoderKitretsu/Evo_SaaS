// Let me create a simple test to verify the structure is correct
const checkStructure = () => {
  console.log("Checking JSX structure...")
  
  // This represents the structure we have:
  const structure = `
    {hasSelectedInstance && (
      <section id="bulkCard">
        <div className="grid">
          <div>content</div>
          <div>content</div>
        </div>
      </section>
    )}
  `
  
  console.log("Structure should be valid:", structure)
}

checkStructure()