/**
 * App Configuration
 *
 * Customize your newsletter site by editing the values below.
 * Changes to this file will automatically update your entire site.
 */
export default defineAppConfig({
  // UI Theme Colors
  ui: {
    colors: {
      primary: 'green',    // Main brand color
      neutral: 'slate'     // Neutral/gray tones
    }
  },

  // Site Metadata
  site: {
    name: 'Vue.js Weekly',                               // Site title
    description: 'Weekly Vue.js news and community updates', // Site description for SEO
    url: 'https://vue-weekly.com',                      // Production URL
    author: 'Vue.js Weekly Team'                        // Author name
  },

  // Branding & Visual Identity
  branding: {
    logo: {
      icon: 'i-simple-icons-vuedotjs',  // Icon from Iconify (https://icones.js.org/)
      text: 'Vue.js Weekly'              // Logo text
    },
    separator: {
      icon: 'i-simple-icons-vuedotjs'   // Icon for page separator
    }
  },

  // Navigation Links
  navigation: {
    header: [
      { label: 'Home', to: '/' },
      { label: 'Archive', to: '/newsletters' },
      { label: 'RSS', to: '/rss.xml', target: '_blank' }
    ]
    // To add more links, simply add more objects:
    // { label: 'About', to: '/about' },
    // { label: 'Contact', to: '/contact' }
  },

  // Social Links
  social: {
    github: 'https://github.com/alexanderopalic/ai-sdk-example-newsletter'
    // Add more social links as needed:
    // twitter: 'https://twitter.com/yourusername',
    // linkedin: 'https://linkedin.com/company/yourcompany'
  },

  // Footer Configuration
  footer: {
    text: 'Vue.js Weekly',  // Footer text
    showYear: true          // Show copyright year
  }
})
