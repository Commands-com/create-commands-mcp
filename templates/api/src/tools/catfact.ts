import { Tool, MCPError } from '../types';

/**
 * Cat Fact Tool - Demonstrates external API integration with offline fallback
 * 
 * This tool shows:
 * - HTTP requests to external APIs
 * - Error handling and fallback strategies
 * - Offline development support
 * - Rate limiting considerations
 */
export const catFactTool: Tool = {
  name: 'cat_fact',
  description: 'Get a random cat fact from an external API with offline fallback',
  inputSchema: {
    type: 'object',
    properties: {
      length: {
        type: 'string',
        enum: ['short', 'medium', 'long', 'any'],
        description: 'Preferred length of the cat fact',
        default: 'any'
      }
    },
    required: []
  },
  handler: async (args: { length?: string }) => {
    const length = args.length || 'any';
    
    try {
      // Try to fetch from external API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('https://catfact.ninja/fact', {
        method: 'GET',
        headers: {
          'User-Agent': 'create-commands-mcp-demo',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data: any = await response.json();
      
      if (!data.fact) {
        throw new Error('Invalid response format from API');
      }
      
      // Filter by length if requested
      let filteredFact = data.fact;
      if (length !== 'any') {
        const factLength = data.fact.length;
        const isValidLength = 
          (length === 'short' && factLength <= 100) ||
          (length === 'medium' && factLength > 100 && factLength <= 200) ||
          (length === 'long' && factLength > 200);
        
        if (!isValidLength) {
          // Fall back to offline fact if length doesn't match
          filteredFact = getOfflineCatFact(length);
        }
      }
      
      return {
        fact: filteredFact,
        length: filteredFact.length,
        source: 'catfact.ninja',
        timestamp: new Date().toISOString(),
        requested_length: length,
        online: true
      };
      
    } catch (error) {
      // Fallback to offline facts
      console.warn('External API unavailable, using offline fallback:', error instanceof Error ? error.message : 'Unknown error');
      
      const offlineFact = getOfflineCatFact(length);
      
      return {
        fact: offlineFact,
        length: offlineFact.length,
        source: 'offline_fallback',
        timestamp: new Date().toISOString(),
        requested_length: length,
        online: false,
        fallback_reason: error instanceof Error ? error.message : 'API unavailable'
      };
    }
  }
};

/**
 * Offline fallback cat facts categorized by length
 */
function getOfflineCatFact(length: string): string {
  const facts = {
    short: [
      "Cats sleep 12-16 hours per day.",
      "A group of cats is called a clowder.",
      "Cats have five toes on front paws, four on back.",
      "Cats can't taste sweetness.",
      "A cat's purr heals bones and muscles.",
      "Cats have 32 muscles in each ear."
    ],
    medium: [
      "Cats have been domesticated for approximately 9,000 years. The ancient Egyptians were among the first to domesticate cats, primarily to protect their grain stores from rodents.",
      "A cat's brain is biologically more similar to a human brain than it is to a dog's brain. Both humans and cats have identical regions in their brains that are responsible for emotions.",
      "Cats make about 100 different sounds, while dogs make only about 10. They communicate through meowing, purring, trilling, hissing, growling, and more.",
      "The technical term for a cat's hairball is a bezoar. These form when cats groom themselves and ingest loose fur that accumulates in their digestive system."
    ],
    long: [
      "Cats are believed to have been first domesticated in ancient Egypt around 4,000 years ago, although recent archaeological evidence suggests that the relationship between humans and cats may have begun much earlier, possibly around 9,000 years ago in the Near East. The ancient Egyptians revered cats so much that they worshipped a cat goddess named Bastet, and killing a cat was considered a capital offense. When a family cat died, the household would go into mourning, and the cat would often be mummified and buried with precious items.",
      "The ability of cats to land on their feet when falling is called the 'righting reflex,' and it's a remarkable demonstration of physics and biology working together. This reflex is fully developed by the time a kitten is 7 weeks old. During a fall, cats can twist their bodies to orient themselves using their inner ear balance system and flexible backbone. However, cats need at least 12 inches of fall distance to complete this maneuver, and they can actually be injured more severely from shorter falls where they don't have time to right themselves.",
      "Cats have an extraordinary sense of smell that is 14 times stronger than humans. They possess something called the vomeronasal organ, or Jacobson's organ, located in the roof of their mouth. This allows them to 'taste' scents and is why you might see a cat making a strange face with their mouth slightly open after smelling something interesting – this behavior is called the flehmen response. This incredible olfactory ability helps cats detect pheromones, identify other cats, locate prey, and navigate their environment."
    ]
  };
  
  const categoryFacts = facts[length as keyof typeof facts] || [...facts.short, ...facts.medium, ...facts.long];
  return categoryFacts[Math.floor(Math.random() * categoryFacts.length)];
}