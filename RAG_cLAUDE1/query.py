import os
from rag import RAGPipeline, RAGConfig

cfg = RAGConfig(
    qdrant_url=os.getenv("QDRANT_URL"),
    qdrant_api_key=os.getenv("QDRANT_API_KEY"),
    qdrant_collection=os.getenv("QDRANT_COLLECTION", "OOP_COURSE_MATERIAL"),
    top_k=10,
)

rag = RAGPipeline(config=cfg).use_existing()

result = rag.query("What is encapsulation in object oriented programming?")

print("\n" + "=" * 60)
print("ANSWER")
print("=" * 60)
print(result["answer"])

print("\n" + "=" * 60)
print("CHUNKS RETRIEVED (used as context)")
print("=" * 60)
for ref in result["references"]:
    print(f"\n  File    : {ref['source']}")
    print(f"  Page    : {ref['page']}")
    print(f"  Chunk   : {ref['chunk_id']}")
    print(f"  Snippet : {ref['snippet']}...")
