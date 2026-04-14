import { describe, it, expect } from 'bun:test'
import { SkillLoader, skillLoader } from '../../src/features/skills'

describe('Skills Feature', () => {
  describe('SkillLoader', () => {
    it('should export SkillLoader class', () => {
      expect(SkillLoader).toBeDefined()
    })

    it('should return empty array for nonexistent path', () => {
      const loader = new SkillLoader('/nonexistent/path')
      const skills = loader.loadSkills()
      expect(Array.isArray(skills)).toBe(true)
      expect(skills.length).toBe(0)
    })

    it('should return undefined for missing skill', () => {
      const loader = new SkillLoader('/nonexistent/path')
      loader.loadSkills()
      expect(loader.getSkill('nonexistent')).toBeUndefined()
    })
  })

  describe('skillLoader singleton', () => {
    it('should be a SkillLoader instance', () => {
      expect(skillLoader).toBeDefined()
      expect(skillLoader).toBeInstanceOf(SkillLoader)
    })
  })
})
