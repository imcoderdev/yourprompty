import { getConnection } from '../db.js';

/**
 * Helper to execute SQL queries
 */
async function query(text, params = []) {
  const conn = await getConnection();
  return conn.query(text, params);
}

/**
 * Get personalized recommendations for a user
 * Priority:
 * 1. New prompts from followed creators (highest priority)
 * 2. Prompts similar to user's liked/viewed prompts
 * 3. Trending/popular prompts
 */
export async function getRecommendations(userEmail, limit = 20) {
  try {
    const recommendations = [];

    // 1. Get prompts from followed creators (last 7 days)
    const followedCreatorsPrompts = await getFollowedCreatorsPrompts(userEmail, 10);
    recommendations.push(...followedCreatorsPrompts.map(p => ({
      ...p,
      reason: 'From creators you follow',
      score: 10
    })));

    // 2. Get prompts based on user's liked categories
    if (recommendations.length < limit) {
      const similarPrompts = await getSimilarPrompts(userEmail, limit - recommendations.length);
      recommendations.push(...similarPrompts.map(p => ({
        ...p,
        reason: 'Based on your interests',
        score: 7
      })));
    }

    // 3. Get trending prompts if we still need more
    if (recommendations.length < limit) {
      const trendingPrompts = await getTrendingPrompts(userEmail, limit - recommendations.length);
      recommendations.push(...trendingPrompts.map(p => ({
        ...p,
        reason: 'Trending now',
        score: 5
      })));
    }

    // Remove duplicates and prompts user already interacted with
    const uniquePrompts = await filterDuplicatesAndInteracted(recommendations, userEmail);

    // Sort by score and return
    return uniquePrompts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Get recent prompts from creators the user follows
 */
async function getFollowedCreatorsPrompts(userEmail, limit = 10) {
  const queryText = `
    SELECT DISTINCT
      p.*,
      u.name as creator_name,
      u.user_id as creator_username,
      u.profile_photo as creator_photo
    FROM prompts p
    INNER JOIN followers f ON p.author_email = f.followee_email
    INNER JOIN users u ON p.author_email = u.email
    WHERE f.follower_email = $1
      AND p.created_at >= NOW() - INTERVAL '7 days'
    ORDER BY p.created_at DESC
    LIMIT $2
  `;

  const result = await query(queryText, [userEmail, limit]);
  return result.rows;
}

/**
 * Get prompts similar to what user has liked/viewed
 */
async function getSimilarPrompts(userEmail, limit = 10) {
  const queryText = `
    WITH user_preferences AS (
      -- Get categories user has liked
      SELECT 
        p.category,
        COUNT(*) as like_count
      FROM prompt_likes pl
      INNER JOIN prompts p ON pl.prompt_id = p.id
      WHERE pl.user_email = $1
      GROUP BY p.category
      ORDER BY like_count DESC
      LIMIT 3
    )
    SELECT DISTINCT
      p.*,
      u.name as creator_name,
      u.user_id as creator_username,
      u.profile_photo as creator_photo,
      (
        CASE WHEN p.category IN (SELECT category FROM user_preferences) THEN 3 ELSE 0 END +
        CASE WHEN p.like_count > 10 THEN 1 ELSE 0 END
      ) as relevance_score
    FROM prompts p
    INNER JOIN users u ON p.author_email = u.email
    WHERE p.category IN (SELECT category FROM user_preferences)
    AND p.created_at >= NOW() - INTERVAL '30 days'
    AND p.author_email != $1
    ORDER BY relevance_score DESC, p.created_at DESC
    LIMIT $2
  `;

  const result = await query(queryText, [userEmail, limit]);
  return result.rows;
}

/**
 * Get trending/popular prompts
 */
async function getTrendingPrompts(userEmail, limit = 10) {
  const queryText = `
    SELECT 
      p.*,
      u.name as creator_name,
      u.user_id as creator_username,
      u.profile_photo as creator_photo,
      (p.like_count * 2 + p.comment_count) as trending_score
    FROM prompts p
    INNER JOIN users u ON p.author_email = u.email
    WHERE p.created_at >= NOW() - INTERVAL '14 days'
    AND p.author_email != $1
    ORDER BY trending_score DESC, p.created_at DESC
    LIMIT $2
  `;

  const result = await query(queryText, [userEmail, limit]);
  return result.rows;
}

/**
 * Filter out prompts user has already interacted with and remove duplicates
 */
async function filterDuplicatesAndInteracted(prompts, userEmail) {
  // Get prompts user has already liked
  const interactedQuery = `
    SELECT DISTINCT prompt_id 
    FROM prompt_likes 
    WHERE user_email = $1
  `;
  const interactedResult = await query(interactedQuery, [userEmail]);
  const interactedIds = new Set(interactedResult.rows.map(row => row.prompt_id));

  // Remove duplicates and already interacted prompts
  const seen = new Set();
  return prompts.filter(prompt => {
    if (seen.has(prompt.id) || interactedIds.has(prompt.id) || prompt.author_email === userEmail) {
      return false;
    }
    seen.add(prompt.id);
    return true;
  });
}

/**
 * Track user interaction (like, view, copy)
 */
export async function trackInteraction(userEmail, promptId, interactionType) {
  const queryText = `
    INSERT INTO user_interactions (user_email, prompt_id, interaction_type)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_email, prompt_id, interaction_type) 
    DO UPDATE SET created_at = NOW()
    RETURNING *
  `;

  const result = await query(queryText, [userEmail, promptId, interactionType]);
  return result.rows[0];
}

/**
 * Follow a creator
 */
export async function followCreator(followerEmail, creatorEmail) {
  const queryText = `
    INSERT INTO followers (follower_email, followee_email)
    VALUES ($1, $2)
    ON CONFLICT (follower_email, followee_email) DO NOTHING
    RETURNING *
  `;

  const result = await query(queryText, [followerEmail, creatorEmail]);
  return result.rows[0];
}

/**
 * Unfollow a creator
 */
export async function unfollowCreator(followerEmail, creatorEmail) {
  const queryText = `
    DELETE FROM followers
    WHERE follower_email = $1 AND followee_email = $2
    RETURNING *
  `;

  const result = await query(queryText, [followerEmail, creatorEmail]);
  return result.rows[0];
}

/**
 * Check if user is following a creator
 */
export async function isFollowing(followerEmail, creatorEmail) {
  const queryText = `
    SELECT EXISTS(
      SELECT 1 FROM followers
      WHERE follower_email = $1 AND followee_email = $2
    ) as is_following
  `;

  const result = await query(queryText, [followerEmail, creatorEmail]);
  return result.rows[0].is_following;
}

/**
 * Get follower/following counts
 */
export async function getFollowStats(userEmail) {
  const queryText = `
    SELECT 
      (SELECT COUNT(*) FROM followers WHERE followee_email = $1) as followers_count,
      (SELECT COUNT(*) FROM followers WHERE follower_email = $1) as following_count
  `;

  const result = await query(queryText, [userEmail]);
  return result.rows[0];
}
