
async function testSurveySubmission() {
  const surveyData = {
    feature: 'marketplace',
    rating: 5,
    feedback: 'Test feedback from script'
  };

  try {
    const response = await fetch('http://localhost:5000/api/surveys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(surveyData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Survey submitted successfully:', result);
    } else {
      const error = await response.json();
      console.error('Failed to submit survey:', error);
    }
  } catch (err) {
    console.error('Error during survey submission:', err);
  }
}

testSurveySubmission();
