async function updateChineseTranslators() {
  const res = await fetch("http://localhost:3001/api/admin/interpreters");
  const { data } = await res.json();

  const chineseTranslators = data.filter(t => {
    const langs = t.languages || [];
    const hasZhCN = langs.some(l => l.code === "zh-CN");
    const hasZhTW = langs.some(l => l.code === "zh-TW");
    return hasZhCN && !hasZhTW;
  });

  console.log("중국어 통역사 (번체 추가 필요):", chineseTranslators.length, "명");

  let updated = 0;
  for (const t of chineseTranslators) {
    const zhCN = t.languages.find(l => l.code === "zh-CN");
    const newLanguages = [...t.languages, { code: "zh-TW", proficiency: zhCN?.proficiency || "fluent" }];

    // Send full object with updated languages
    const updateData = {
      slug: t.slug,
      name: t.name,
      bio_short: t.bio_short,
      bio_full: t.bio_full,
      photo_url: t.photo_url,
      years_of_experience: t.years_of_experience,
      primary_specialty: t.primary_specialty,
      secondary_specialties: t.secondary_specialties,
      languages: newLanguages,
      certifications: t.certifications,
      location: t.location,
      preferred_messenger: t.preferred_messenger,
      is_active: t.is_active,
      is_verified: t.is_verified,
      is_featured: t.is_featured,
    };

    const updateRes = await fetch("http://localhost:3001/api/admin/interpreters/" + t.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });

    if (updateRes.ok) {
      console.log("✅", t.name?.ko || t.slug);
      updated++;
    } else {
      const err = await updateRes.json();
      console.log("❌", t.name?.ko || t.slug, "-", err.error);
    }
  }

  console.log("\n=== 완료 ===");
  console.log("업데이트:", updated, "명");
}

updateChineseTranslators();
