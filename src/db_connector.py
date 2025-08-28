from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
import os
import logging
import json
from langchain_pinecone import PineconeVectorStore
from pathlib import Path
from langchain_huggingface import HuggingFaceEmbeddings 

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("dbconection")


class DB_Pinecone():
    def __init__(self,dbname,key):
        self.pc = None
        self.index = None
        self.DBname = dbname
        self.api_key = key
        self.embed_model = HuggingFaceEmbeddings(
            model_name="intfloat/multilingual-e5-large", # 예를 들어 "sentence-transformers/all-MiniLM-L6-v2"
            model_kwargs={"trust_remote_code":True}
        )

    def create_connection(self):
        self.pc = Pinecone(api_key=self.api_key, environment="AWS")
        self.index = self.pc.Index(self.DBname)

    def status(self):
        logger.info(f"🤖 DB 상태를 보고합니다. \n:{self.index.describe_index_stats()}")

    def input_json_data(self,data):
        logger.info("🤖 DB 입력을 시도합니다. ")
        
        items = self.json_to_vector(data)
        # Pinecone에 업서트
        self.index.upsert(
            namespace=self.DBname,
            vectors=items
        )
        
        logger.info(f"🤖 {len(items)}개 항목 // {data} 를 정상적으로 입력했습니다.. ")
        
    def json_to_vector(self,json_file):

        # 인덱스 참조
        index = self.index

        # JSON 파일 읽기
        raw = json.loads(Path(json_file).read_text(encoding='utf-8'))
        records = raw['기술']['jsonArray']

        # 벡터화 및 업서트 준비
        items = []

        for idx, record in enumerate(records):
            text = record['bsnsSumryCn']
            
            # 텍스트를 벡터로 변환
            vector = self.embed_model.embed_query(text)
            
            # ID 구성
            rec_id = f"{record['pblancId']}#{idx}"
            
            # metadata 구성
            metadata = {
                "title": record.get("pblancNm", ""),
                "summary" : record.get('bsnsSumryCn'),
                "region": record.get("jrsdInsttNm", ""),
                "hashtags": record.get("hashtags", ""),
                "file_path": record.get("fileNm", "")
            }
            
            items.append({
                "id": rec_id,
                "values": vector,
                "metadata": metadata
            })
        
        return items

    def search_database(self,query:str,top_k:int):
        index = self.index

        # 자연어 질의로 직접 검색
        response = index.search(
            namespace=self.DBname,
            query={
                "top_k": top_k,
                "inputs": {"text": query},
            },
            fields=["summary","title"]
        )
        print(response)
        print("\n\n")
        '''
        query = self.pc.inference.embed(
                model="llama-text-embed-v2",
                inputs=[query],
                parameters={"input_type": "passage", "truncate": "END"}
            )
        filtered_results = index.search(
            namespace=self.DBname, 
            query={
                "inputs": {"text": query}, 
                "top_k": top_k,
                #"filter": {"document_id": "document1"}
            },
            fields=["values","metadata"]
        )

        print(filtered_results)
        '''

if __name__ == "__main__":
    load_dotenv()
    pinecone_db = DB_Pinecone("kt-agent",os.getenv("PINECONE_API_KEY"))
    pinecone_db.create_connection()
    pinecone_db.status()
    #pinecone_db.input_json_data("src/data/all_categories.json")
    pinecone_db.search_database("제조 기술과 AI 관련된 거 보여줘",30)    