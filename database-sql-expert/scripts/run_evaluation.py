#!/usr/bin/env python3
"""
Simple evaluation script for sql-expert skill.
This demonstrates the evaluation workflow mentioned in skill-creator.
"""

import json
import os
import subprocess
import sys
from datetime import datetime

def load_test_prompts():
    """Load test prompts from evals/evals.json"""
    evals_path = os.path.join(os.path.dirname(__file__), '../evals/evals.json')
    with open(evals_path, 'r') as f:
        return json.load(f)

def run_opencode_test(prompt):
    """Run opencode with the sql-expert agent on a test prompt"""
    # Note: This is a simplified example. In practice, you'd want to:
    # 1. Actually run opencode and capture the output
    # 2. Compare against expected topics
    # 3. Grade the results
    print(f"Testing prompt: {prompt}")
    # Placeholder for actual opencode execution
    # result = subprocess.run(['opencode', 'run', prompt], 
    #                        capture_output=True, text=True)
    # return result.stdout
    return f"[Simulated response for: {prompt}]"

def main():
    print("Running sql-expert skill evaluation...")
    print("=" * 50)
    
    test_cases = load_test_prompts()
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Prompt: {test_case['prompt']}")
        
        # Run the test (simulated)
        response = run_opencode_test(test_case['prompt'])
        print(f"Response: {response}")
        
        # Simple check for expected topics (placeholder logic)
        found_topics = []
        for topic in test_case['expected_topics']:
            if topic.lower() in response.lower():
                found_topics.append(topic)
        
        print(f"Expected topics: {test_case['expected_topics']}")
        print(f"Found topics: {found_topics}")
        
        results.append({
            'test_case': test_case,
            'response': response,
            'found_topics': found_topics,
            'score': len(found_topics) / len(test_case['expected_topics']) if test_case['expected_topics'] else 0
        })
    
    # Summary
    print("\n" + "=" * 50)
    print("EVALUATION SUMMARY")
    print("=" * 50)
    
    total_score = sum(r['score'] for r in results) / len(results) if results else 0
    print(f"Overall Score: {total_score:.2%}")
    
    for i, result in enumerate(results, 1):
        print(f"Test {i}: {result['score']:.2%} - {result['test_case']['prompt'][:50]}...")
    
    # Save results
    results_dir = os.path.join(os.path.dirname(__file__), '../evals')
    os.makedirs(results_dir, exist_ok=True)
    
    results_file = os.path.join(results_dir, f'evaluation_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'overall_score': total_score,
            'results': results
        }, f, indent=2)
    
    print(f"\nDetailed results saved to: {results_file}")
    print("\nNote: This is a demonstration script. For real evaluation,")
    print("you would need to integrate with opencode's actual output.")
    
    return 0 if total_score > 0.7 else 1  # Arbitrary threshold

if __name__ == '__main__':
    sys.exit(main())