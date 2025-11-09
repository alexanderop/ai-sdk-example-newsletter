# Prompt Improvements for Claude 4.x

**Date:** November 9, 2025  
**File:** `scripts/generate-newsletter.ts`

## Summary

Updated prompts in the newsletter generation script to follow Claude 4.x best practices, resulting in more precise instruction following, better output quality, and improved grounding in real data.

## Key Improvements

### 1. **Explicit Instructions with Context**

**Before:**
```
You are a Vue.js newsletter curator. Generate a professional weekly newsletter...
```

**After:**
```
You are an expert Vue.js newsletter curator with deep knowledge of the Vue.js ecosystem. 
Your role is to create engaging, accurate, and informative weekly newsletters that help 
developers stay current with Vue.js developments.
```

**Why:** Provides clear context about the role and motivation, helping Claude understand the purpose and importance of accuracy.

### 2. **XML-Tagged Structure for Clarity**

Added structured sections using XML tags:
- `<newsletter_requirements>` - Why accuracy matters
- `<output_format>` - Specific formatting guidelines
- `<content_guidelines>` - Content creation rules
- `<quality_standards>` - Quality checklist

**Why:** Claude 4.x models respond exceptionally well to XML-structured prompts, improving instruction following precision.

### 3. **Explicit Output Format Instructions**

**Before:**
```
Use markdown formatting for readability
```

**After:**
```
Structure your newsletter with clear markdown formatting:
- Use # for the main title: "# Vue.js Weekly Newsletter"
- Use ## for major sections
- Use **bold** for emphasis on project names
- Use links in the format [Title](URL)
- Include star counts using the ⭐ emoji when available
```

**Why:** Claude 4.x pays close attention to examples and specific formatting instructions. Explicit guidance ensures consistent output.

### 4. **Context and Motivation**

Added explanation for WHY rules matter:

```
Your newsletter will be read by Vue.js developers who rely on accurate, timely 
information to make technical decisions. Therefore, factual accuracy and grounding 
in real data is critical for maintaining reader trust and providing genuine value 
to the community.
```

**Why:** Providing motivation helps Claude 4.x better understand goals and deliver more targeted responses.

### 5. **Improved User Prompt Specificity**

**Before:**
```
Generate this week's Vue.js newsletter using this real data:
```

**After:**
```
Create this week's Vue.js Weekly Newsletter using the real data provided below. 
Present the information in an engaging, well-structured format that helps Vue.js 
developers quickly understand what's happening in the ecosystem. Include thoughtful 
commentary that provides context about why each item matters to the Vue.js community.
```

**Why:** More specific instructions about desired behavior lead to better results with Claude 4.x's precise instruction following.

### 6. **Structured Data Presentation**

Wrapped contextData in XML tags:
```
<real_data>
${contextData}
</real_data>
```

**Why:** Clear data boundaries help Claude distinguish between instructions and input data.

### 7. **Quality Guidelines Integration**

Added explicit quality standards covering:
- URL formatting verification
- Statistics accuracy
- Consistent formatting
- Strategic emoji usage
- Concise, value-focused paragraphs

**Why:** Claude 4.x excels when given clear success criteria and quality checklists.

## Expected Benefits

1. **More Consistent Output Format** - XML structure and explicit formatting rules reduce variation
2. **Better Grounding** - Emphasis on context and motivation reduces hallucinations
3. **Higher Quality** - Quality standards provide clear success criteria
4. **More Engaging Content** - Instructions to provide context about "why it matters" improve newsletter value
5. **Improved Token Efficiency** - Better structured prompts can lead to more direct responses

## Best Practices Applied

From Claude 4.x prompting guide:

- ✅ **Be explicit with instructions** - Detailed formatting and content guidelines
- ✅ **Add context to improve performance** - Explained why accuracy matters
- ✅ **Be vigilant with examples** - Provided specific formatting examples
- ✅ **Tell Claude what to do instead of what not to do** - Positive framing throughout
- ✅ **Use XML format indicators** - Structured sections with XML tags
- ✅ **Match prompt style to desired output** - Professional, structured prompt for professional output

## Testing Recommendations

1. Run `pnpm newsletter` to generate a new newsletter
2. Compare output quality with previous version (`newsletters/2025-11-09-vue-weekly.md`)
3. Verify:
   - Consistent markdown formatting
   - No placeholder content
   - Engaging commentary about why items matter
   - Proper URL formatting
   - Accurate statistics

## Future Enhancements

Potential additions based on Claude 4.x capabilities:

1. **Parallel Tool Calling** - If adding more data sources, use explicit parallel tool calling guidance
2. **Extended Thinking** - For complex newsletter analysis, could add thinking prompts
3. **Multi-Context Workflows** - If newsletters grow complex, implement state tracking patterns
4. **Verification Tools** - Add fact-checking prompts for critical information

## Related Documentation

- Original implementation: `docs/plans/2025-11-09-vue-newsletter-agent-implementation.md`
- Design document: `docs/plans/2025-11-09-vue-newsletter-agent-design.md`
- Claude 4.x prompting guide: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering
